/**
 * The orchestrator: a DETERMINISTIC 6-stage pipeline. We drive the order in code
 * (analyze -> explore UI -> manual cases -> script -> run -> analyze run) because
 * each stage strictly depends on the previous one's artifact. Each stage is one
 * Claude "agent" — a focused query() call with its own system prompt, model and toolset.
 */
import { query, type PermissionResult } from '@anthropic-ai/claude-agent-sdk';
import { createInterface } from 'node:readline/promises';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { qaServer, QA_TOOL_NAMES, REPO_ROOT } from './tools.ts';
import { renderMarkdownToHtml } from './html.ts';
import { buildSuiteViewer } from './build-suite-viewer.ts';

/**
 * Default cap on self-heal reworks per review stage. After the initial review,
 * the artifact's author is given at most this many chances to fix valid findings
 * (so at most maxRework+1 review passes). Beyond it we stop, finalize the artifact
 * as-is, and report the remaining issues to the human. 2 is a deliberate balance:
 * most genuine defects resolve in 1–2 passes; a verdict still failing after that is
 * usually real disagreement or ambiguity that needs a human, not more token spend.
 * Override per run with --max-rework <n>.
 */
const DEFAULT_MAX_REWORK = 2;

/**
 * Default cap on test-script self-heal cycles after the run stage. Each cycle = fix
 * test-side failures (locators/actions) + re-run the suite. After this many cycles any
 * still-failing tests are left for the triage stage to classify. Override with --max-heal.
 */
const DEFAULT_MAX_HEAL = 2;

/** Models per stage — cheap models for mechanical work, strong ones for reasoning. */
const MODELS = {
  analyze: 'claude-sonnet-4-6',
  explore: 'claude-sonnet-4-6',
  manual: 'claude-sonnet-4-6',
  script: 'claude-opus-4-8',
  run: 'claude-haiku-4-5',
  report: 'claude-sonnet-4-6',
  // Reviewer: semantic critique of another AI's artifact. NOT a cheap mechanical
  // check — a weaker model would rubber-stamp reasoning it can't follow — so use a
  // strong model. Bump to 'claude-opus-4-8' if you want the toughest critic.
  review: 'claude-sonnet-4-6',
} as const;

/**
 * When true, the Explore stage opens a VISIBLE browser window so you can watch
 * the agent click around; otherwise it runs headless. Set by runPipeline().
 */
let exploreHeaded = false;

/**
 * Official Microsoft Playwright MCP server (stdio). Gives the agent real-browser
 * tools — navigate, click, type, and accessibility `snapshot` — so it can explore
 * the live UI instead of guessing. Spawned via npx only for stages that need it.
 */
const playwrightServer = () => ({
  type: 'stdio' as const,
  command: 'npx',
  args: ['-y', '@playwright/mcp@latest', ...(exploreHeaded ? [] : ['--headless'])],
});

interface StageOpts {
  /** Display name of the stage. */
  name: string;
  /** Which Claude model runs this stage. */
  model: string;
  /** SKILL: the agent's expertise + the method/rules it must follow (becomes the system prompt). */
  skill: string;
  /** INPUT: file/artifact paths (relative to repo root) the agent must read first. */
  inputs: string[];
  /** OUTPUT: the single file path this stage must write its result to. */
  output: string;
  /** The concrete task + required output format/sections. */
  task: string;
  /** When true, attach the Playwright MCP server and allow its browser tools (live UI exploration). */
  browser?: boolean;
  /**
   * When true, an adversarial reviewer agent critiques this stage's artifact
   * (grounded against this stage's own `inputs`) BEFORE the human gate, writing
   * advisory notes to `<output>.review.md`. It never edits the artifact — you do.
   */
  review?: boolean;
  /**
   * When true, a TOOL writes `output` (e.g. run_playwright dumps its JSON straight
   * to disk), so the agent must NOT call write_file itself — it would otherwise be
   * told to transcribe a possibly-huge result by hand. See Stage 5.
   */
  selfWritesOutput?: boolean;
  /** Override the per-stage turn cap. Defaults to 150 for browser stages, 50 otherwise. */
  maxTurns?: number;
  /**
   * When true, after this stage runs the test suite, a self-heal loop diagnoses failing
   * tests and fixes TEST-SIDE causes (wrong locator / action / wait) in the spec & page
   * objects, re-running until green or maxHeal cycles are hit. It never masks a product
   * bug — those are left failing for the triage stage. See healAndRerun().
   */
  heal?: boolean;
}

/**
 * Transient failures from the streaming API or its CDN that are worth retrying:
 * Cloudflare 5xx (520/522/523/524), 429/500/502/503/504, Anthropic 529 "overloaded",
 * and raw socket errors. A 4xx like 400/401/403 is deliberately NOT here — that is our
 * own bug (bad request / auth), so it must fail fast rather than spin on retries.
 */
const RETRYABLE_ERROR =
  /(\b(429|500|502|503|504|520|522|523|524|529)\b|overloaded|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|connection[_ ]?(timed out|error|reset)|socket hang up|fetch failed)/i;

/** Pull a server-suggested backoff (in seconds) out of an error message, if it carries one. */
function retryAfterSeconds(msg: string): number | null {
  const m = msg.match(/"retry_after"\s*:\s*(\d+)/i) ?? msg.match(/back off for at least (\d+)\s*second/i);
  return m ? Number(m[1]) : null;
}

/**
 * Run `fn` (one full stage execution) and retry on transient API/CDN errors with
 * exponential backoff — honouring a server-supplied retry_after when present. A stage
 * only writes its artifact on SUCCESS, so re-running from the top is safe: we just lose
 * the in-progress streamed tokens, not any persisted artifact. Non-retryable errors
 * (4xx, bugs) propagate immediately; after maxAttempts the last error propagates too.
 */
async function withRetry<T>(label: string, fn: () => Promise<T>, maxAttempts = 4): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt >= maxAttempts || !RETRYABLE_ERROR.test(msg)) throw err;
      const suggested = retryAfterSeconds(msg);
      const waitSec = suggested != null ? Math.min(suggested, 120) : Math.min(60, 5 * 2 ** (attempt - 1));
      console.warn(
        `\n\x1b[33m   ⚠ ${label}: transient API error (attempt ${attempt}/${maxAttempts}) — retrying in ${waitSec}s\x1b[0m`,
      );
      console.warn(`\x1b[2m     ${msg.replace(/\s+/g, ' ').slice(0, 180)}\x1b[0m`);
      await new Promise((r) => setTimeout(r, waitSec * 1000));
    }
  }
}

/** Run one agent stage to completion and return its final text answer. */
async function runStage({ name, model, skill, inputs, output, task, browser, selfWritesOutput, maxTurns }: StageOpts): Promise<string> {
  console.log(`\n\x1b[1;36m▶ STAGE: ${name}\x1b[0m  (${model})${browser ? '  \x1b[35m[browser]\x1b[0m' : ''}`);

  // Assemble the user prompt deterministically from the declared input/output/task.
  const outputSection = selfWritesOutput
    ? `## Output\nThe tool writes ${output} for you (pass it as the output path). Do NOT call write_file — just report the short summary the tool returns.`
    : `## Output\nWrite your result with write_file to exactly this path: ${output}`;
  const prompt =
    `## Inputs — read these first with read_file\n` +
    (inputs.length ? inputs.map((i) => `- ${i}`).join('\n') : '- (none)') +
    `\n\n## Task\n${task}\n\n` +
    outputSection;

  // Tools & permissions are scoped PER STAGE: QA tools always; browser tools only
  // when this stage opts in. Everything else is denied.
  const mcpServers: Record<string, unknown> = browser
    ? { qa: qaServer, playwright: playwrightServer() }
    : { qa: qaServer };
  const allowedTools = browser ? [...QA_TOOL_NAMES, 'mcp__playwright'] : QA_TOOL_NAMES;
  const gate = async (toolName: string, input: Record<string, unknown>): Promise<PermissionResult> => {
    const permitted =
      QA_TOOL_NAMES.includes(toolName) || (browser && toolName.startsWith('mcp__playwright__'));
    return permitted
      ? { behavior: 'allow', updatedInput: input }
      : { behavior: 'deny', message: `Tool not permitted in this stage: ${toolName}` };
  };

  // Stream over a long-lived HTTP connection. A transient upstream hiccup (Cloudflare
  // 522/524, 529 overloaded, socket reset) surfaces as a thrown error mid-stream; without
  // a retry it would kill the whole pipeline. withRetry re-runs the stage from the top on
  // such errors — safe because the artifact is only written on success.
  const finalText = await withRetry(name, async () => {
    const response = query({
      prompt,
      options: {
        model,
        systemPrompt: skill,
        mcpServers: mcpServers as any,
        allowedTools,
        // Disable ALL built-in Claude Code tools (Bash, Write, Read, Edit, Task, …).
        // `allowedTools` alone does NOT remove them from the model's context — only
        // `tools` does. Without this the model SEES built-ins, our gate denies them at
        // run time, and the agent burns its whole turn budget flailing with cp/tee/
        // base64 instead of just calling mcp__qa__write_file. MCP tools come from
        // `mcpServers` and are unaffected by this.
        tools: [],
        canUseTool: gate,
        cwd: REPO_ROOT,
        maxTurns: maxTurns ?? (browser ? 150 : 50),
      },
    });

    let text = '';
    try {
      for await (const msg of response) {
        if (msg.type === 'assistant') {
          for (const block of msg.message.content) {
            if (block.type === 'text') process.stdout.write(`\x1b[2m${block.text}\x1b[0m`);
            if (block.type === 'tool_use') console.log(`\n  \x1b[33m↳ ${block.name}\x1b[0m`);
          }
        } else if (msg.type === 'result') {
          if (msg.subtype === 'success') text = msg.result;
          else console.error(`\n\x1b[31m  stage ended: ${msg.subtype}\x1b[0m`);
        }
      }
    } catch (err) {
      // Hitting the turn cap is NOT transient — retrying from scratch would hit the same
      // wall — so it must not flow through withRetry's retry path. But the agent may have
      // already written a (partial) artifact before running out. If the expected output
      // exists on disk, salvage it and let the pipeline continue (the human gate / next
      // stage can judge it); otherwise fail with an actionable hint instead of a stack trace.
      const m = err instanceof Error ? err.message : String(err);
      if (!/maximum number of turns|max_turns/i.test(m)) throw err;
      if (existsSync(resolve(REPO_ROOT, output))) {
        console.warn(`\n\x1b[33m   ⚠ ${name} hit the turn cap, but ${output} was written — continuing with the partial artifact.\x1b[0m`);
        console.warn(`\x1b[2m     If it looks incomplete, raise this stage's maxTurns or narrow its scope, then re-run with --from <stage>.\x1b[0m`);
        return text;
      }
      throw new Error(`${name} hit the turn cap before writing ${output}. Raise this stage's maxTurns or narrow its scope, then re-run with --from <stage>.`);
    }
    return text;
  });

  console.log(`\n\x1b[32m✓ ${name} done\x1b[0m`);
  return finalText;
}

/**
 * SKILL of the reviewer agent (its system prompt). Deliberately ADVERSARIAL and
 * GROUNDED: a strong model told to hunt for what's wrong, judging the artifact
 * ONLY against the source it was derived from — not against what merely "sounds
 * right". It reports; it never edits (you stay the final gate).
 */
const REVIEWER_SKILL =
  'You are an adversarial QA reviewer. Another AI produced the artifact under review; ' +
  'your job is to find what is WRONG, MISSING, or UNSUPPORTED — not to praise it. Default to skepticism.\n' +
  'Ground EVERY judgement in the SOURCE inputs (the requirement / upstream artifacts this artifact was ' +
  'derived from), NOT in what merely sounds plausible. An artifact can read smoothly and still drop a ' +
  'requirement, contradict itself, or invent behaviour the source never stated.\n' +
  'Check specifically:\n' +
  '- Fidelity: does the artifact faithfully reflect the source? Flag anything INVENTED (not implied by the ' +
  'source) and anything in the source that was DROPPED.\n' +
  '- Coverage / traceability: is every requirement / acceptance criterion accounted for? Name the EXACT IDs ' +
  '(AC-n, TC-n) that are missing or only partially covered.\n' +
  '- Contradictions & ambiguity: internal conflicts, or vague steps/criteria a tester could not act on deterministically.\n' +
  '- Format / structure: required sections/columns present and well-formed.\n' +
  '- Internal consistency (no source needed): every User Flow maps to at least one AC; every requirement worded ' +
  '"at all times / always / remains / preserves / keeps / does not clear" has an AC covering the TRANSITION and ' +
  'PERSISTENCE, not just the first-achieved state. A flow with no AC, or such a requirement tested only at its ' +
  'initial state, is a valid finding even when the source is otherwise fully covered.\n' +
  'How to judge COVERAGE — avoid false "gap" findings:\n' +
  '- If the artifact has a Traceability table, grade coverage AGAINST IT; do not re-derive a 1:1 line count from ' +
  'the source. A source item is MISSING only if NO AC (including several ACs combined) covers its assertions. ' +
  'Assertions correctly spread across multiple ACs = decomposed = VALID, not a gap. Only flag (a) an assertion ' +
  'absent everywhere, or (b) a composite source scenario with no single integration AC covering the whole bundle.\n' +
  '- A source list labelled "examples" / "e.g." is ILLUSTRATIVE, not an exhaustive checklist. The artifact may ' +
  'reorganise it, as long as each example is traceable to >=1 AC.\n' +
  '- An Out-of-Scope or Open-Questions item tagged "analyst assumption / not in source" is honest transparency, ' +
  'NOT invented behaviour. Do not demand its removal. At most flag (Minor) that it belongs in "Open Questions / ' +
  'Deferred" rather than "Out of Scope"; acknowledge that surfacing the blind spot is correct.\n' +
  'DOWNSTREAM EVIDENCE OUTRANKS AN UPSTREAM GUESS (do not block a correct narrowing):\n' +
  '- The upstream source is NOT infallible on every dimension. For FEASIBILITY / OBSERVABILITY — "can this AC ' +
  'actually be verified at E2E on the real UI?" — a later stage that has seen the live UI (the exploration ' +
  'report, or test cases built on it) holds BETTER evidence than the analysis, whose E2E/API/unit tags are a ' +
  'PRELIMINARY pre-exploration guess. When they conflict on feasibility, the upstream tag is what is STALE, not ' +
  'the downstream judgement that is wrong.\n' +
  '- So when an artifact LOWERS an AC\'s verification level vs the analysis (e.g. E2E -> API/unit, or defers a ' +
  'sub-assertion), treat it as VALID — NOT invented, NOT a dropped requirement — IF it is backed by a concrete ' +
  'UI-exploration observation (e.g. "rating value is not surfaced on the product card"). Do not tell the author ' +
  'to re-add the assertion or "restore E2E coverage".\n' +
  '- If that lowering is sound but the upstream artifacts have not caught up (analysis still tags it E2E, or the ' +
  'exploration scope table does not list it), raise a Minor finding tagged `upstream-sync`: name the exact edit ' +
  'the human should make (re-level AC-n in the analysis, or add it to the exploration Out-of-UI-Scope table). ' +
  'This is a stale-upstream sync, not a defect in the artifact under review.\n' +
  '- Escalate such a lowering to Major ONLY when it has NO supporting evidence anywhere, or is a SILENT drop ' +
  '(no note, no rationale, not in any deviations section).\n' +
  'SEVERITY: tag every finding Critical / Major / Minor. Critical/Major = a dropped/contradicted/invented ' +
  'requirement, a composite scenario with no integration AC, an orphan flow, or a broken required section. Minor = ' +
  'organisation, placement, wording, or an optional extra AC suggestion.\n' +
  'Rules: do NOT rewrite or edit the artifact, and do NOT use write_file on anything except your own review ' +
  'file. Be concrete — cite the exact section/ID you object to. If a rubric item is clean, say PASS explicitly; do not pad.';

/** Build the reviewer's concrete task: rubric output grounded against the source files. */
function reviewTask(artifactPath: string, sourcePaths: string[]): string {
  return (
    `The artifact UNDER REVIEW is: \`${artifactPath}\`.\n` +
    `Treat these as the GROUND-TRUTH SOURCE it must stay faithful to (read them first):\n` +
    sourcePaths.map((s) => `- \`${s}\``).join('\n') +
    `\n\nReview the artifact against that source using the rubric below. Produce Markdown that ` +
    `BEGINS WITH A SINGLE LINE exactly \`VERDICT: PASS\` or \`VERDICT: FAIL\` (machine-read). ` +
    `FAIL ONLY IF there is at least one Critical or Major finding (a dropped / contradicted / invented ` +
    `requirement, a composite source scenario with no single integration AC, an orphan user flow, or a broken ` +
    `required section). If every finding is Minor (organisation, placement, wording, optional extra AC), the ` +
    `verdict is PASS and those go under Advisory for the human to weigh. ` +
    `Then the report with these sections:\n` +
    `- **Verdict**: one of ✅ Looks good / ⚠️ Minor issues / ❌ Significant gaps — plus a one-sentence justification.\n` +
    `- **Rubric** table: \`| Check | Result | Evidence |\` with one row each for: Fidelity to source, ` +
    `Coverage / traceability, Internal consistency (flows↔ACs, transition/persistence), No contradictions, ` +
    `No ambiguity, Format / structure. Result is PASS or FAIL.\n` +
    `- **Findings (Critical/Major)**: numbered, most severe first. Each = severity + what's wrong + exact location ` +
    `(section / ID) + why it matters + a concrete suggested fix. Write 'None' if there are none.\n` +
    `- **Advisory (Minor)**: lower-severity suggestions the human may accept or ignore; does not affect the verdict. Write 'None' if there are none.\n` +
    `- **Missing requirements / ACs**: judged against the artifact's Traceability table — list source IDs whose ` +
    `assertions no AC covers (decomposed across multiple ACs does NOT count as missing), or 'None'.\n` +
    `Keep it tight and skimmable — this is advisory input for a human, who makes the final call.`
  );
}

/**
 * Run the adversarial reviewer over a stage's artifact and write advisory notes
 * to `<output>.review.md`. Reuses runStage() so the reviewer is locked to the same
 * read_file/write_file sandbox. Returns the review file path (+ rendered HTML).
 */
async function runReview(stage: StageOpts): Promise<{ reviewPath: string; htmlPath?: string }> {
  const reviewPath = stage.output.replace(/\.md$/i, '.review.md');
  await runStage({
    name: `Review · ${stage.name}`,
    model: MODELS.review,
    skill: REVIEWER_SKILL,
    // Read the upstream source (what the artifact must be faithful to) AND the artifact itself.
    inputs: [...stage.inputs, stage.output],
    output: reviewPath,
    task: reviewTask(stage.output, stage.inputs),
  });
  const htmlPath = renderMarkdownToHtml(reviewPath);
  return { reviewPath, htmlPath };
}

/** Read the machine-readable verdict the reviewer wrote at the top of its review file. */
function parseVerdict(reviewPath: string): 'PASS' | 'FAIL' {
  const text = readFileSync(resolve(REPO_ROOT, reviewPath), 'utf8');
  const m = text.match(/VERDICT:\s*(PASS|FAIL)/i);
  if (!m) {
    console.warn(`\x1b[33m   ⚠ No "VERDICT: PASS/FAIL" token found in ${reviewPath}; treating as FAIL.\x1b[0m`);
    return 'FAIL';
  }
  return m[1].toUpperCase() === 'PASS' ? 'PASS' : 'FAIL';
}

/** The rework task: hand the review back to the SAME author to investigate & fix valid findings. */
function reworkTask(artifactPath: string, reviewPath: string, originalTask: string): string {
  return (
    `You previously produced \`${artifactPath}\`. An adversarial reviewer raised issues in \`${reviewPath}\` — read it.\n` +
    `Then:\n` +
    `1. For EACH finding, investigate it against the source inputs and decide VALID (a real defect in the artifact) ` +
    `or INVALID (the reviewer is mistaken). Briefly justify each call in your final reply — NOT inside the artifact.\n` +
    `2. Fix ONLY the genuinely VALID findings. Do NOT change things you can defend just to appease the reviewer, ` +
    `and do NOT add content the source does not support.\n` +
    `3. Preserve everything that was already correct.\n` +
    `Finally, rewrite the COMPLETE corrected artifact with write_file to exactly \`${artifactPath}\` (full file, not a diff).\n\n` +
    `--- For reference, the original task that defines this artifact's required format: ---\n${originalTask}`
  );
}

/** Re-run the stage's author with the review fed back in, overwriting the artifact in place. */
async function runRework(stage: StageOpts, reviewPath: string, attempt: number): Promise<void> {
  await runStage({
    name: `Rework #${attempt} · ${stage.name}`,
    model: stage.model, // same author, same model — it owns the fix
    skill: stage.skill,
    inputs: [...stage.inputs, stage.output, reviewPath],
    output: stage.output, // overwrite the artifact
    task: reworkTask(stage.output, reviewPath, stage.task),
  });
}

/**
 * Self-heal loop for a review stage: review → if FAIL, hand findings back to the
 * author to investigate & fix → re-review → repeat until PASS or maxRework is hit.
 * The artifact's HTML is intentionally NOT rendered here — the caller renders it
 * once, after this settles, so the .html always reflects the FINAL md.
 * Returns the terminal verdict and the path to the last review file.
 */
async function reviewAndRework(
  stage: StageOpts,
  maxRework: number,
  stageNum: number,
): Promise<{ verdict: 'PASS' | 'FAIL'; reviewPath: string }> {
  for (let attempt = 0; ; attempt++) {
    const { reviewPath, htmlPath } = await runReview(stage);
    const verdict = parseVerdict(reviewPath);
    const tag = verdict === 'PASS' ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    console.log(`\n\x1b[1;34m🔎 Review of stage ${stageNum} (pass ${attempt + 1}):\x1b[0m ${tag}  → ${reviewPath}`);
    if (htmlPath) console.log(`   \x1b[36mRead in browser:\x1b[0m ${htmlPath}`);

    if (verdict === 'PASS') {
      console.log(`   \x1b[32m✓ Reviewer approved — finalizing artifact.\x1b[0m`);
      return { verdict, reviewPath };
    }
    if (attempt >= maxRework) {
      console.log(`\n\x1b[1;33m⚠ Stage ${stageNum}: still FAIL after ${maxRework} rework(s) — stopping.\x1b[0m`);
      console.log(`   Artifact is finalized AS-IS. Unresolved issues are listed in: \x1b[1m${reviewPath}\x1b[0m`);
      console.log(`   \x1b[2mReview those manually before approving the stage.\x1b[0m`);
      return { verdict, reviewPath };
    }
    console.log(
      `\n\x1b[2m↻ Rework ${attempt + 1}/${maxRework}: sending the review back to the stage author to investigate & fix…\x1b[0m`,
    );
    await runRework(stage, reviewPath, attempt + 1);
  }
}

/**
 * SKILL of the test-script healer. It repairs FAILING tests whose root cause is on the
 * TEST side (wrong/stale locator, incomplete or mis-ordered action, missing wait) — it
 * must NOT make tests pass by masking a real product bug or weakening assertions.
 */
const HEALER_SKILL =
  'You are a Playwright + TypeScript engineer repairing a FAILING test run on a Page Object Model codebase. ' +
  'You fix failures whose ROOT CAUSE is on the TEST side — a wrong/stale locator, an incomplete or mis-ordered ' +
  'action, or a missing wait/visibility check — NOT to turn tests green at any cost.\n' +
  'Classify EACH failing test before touching anything:\n' +
  '- TEST-SIDE (locator not found / resolved to the wrong element, action did not take effect, timing/race, ' +
  'selector stale after a DOM change): FIX it.\n' +
  '- PRODUCT BUG (the locator & action are correct, but the app behaves wrong so a correct assertion fails): ' +
  'DO NOT touch it — leave the test failing so the triage stage can report the bug. Say so in your reply.\n' +
  '- UNCERTAIN / not enough evidence: do not guess-edit; leave it and note why.\n' +
  'Rules:\n' +
  '- Derive corrected locators from the REAL DOM. Playwright writes an error-context.md (an accessibility ' +
  'snapshot of the page at the moment of failure) under test-results/…; read it to see the actual roles/labels ' +
  'and prefer role/text-based locators over brittle CSS.\n' +
  '- Locators live in PAGE OBJECTS under src/pages (they extend BasePage), NEVER inline in the spec. Fix the ' +
  'locator in the page object; add a missing locator/method there if needed.\n' +
  '- NEVER weaken or delete an assertion, never add unconditional sleeps, never relax an expected value just to ' +
  'pass. Fix the cause, not the symptom.\n' +
  '- Do NOT run the tests yourself — the orchestrator re-runs them after you finish.\n' +
  '- Reuse the project fixture and the @pages/@fixtures aliases; match the existing code style.';

/** Build the healer's concrete task: read failures + DOM evidence, fix only test-side causes. */
function healTask(specPath: string, resultsPath: string): string {
  return (
    `The latest Playwright run wrote its JSON report to \`${resultsPath}\`. Read it first to find tests with ` +
    `status "unexpected" (failed) and their error messages / stacks.\n` +
    `Then gather DOM evidence: run list_dir on "test-results", and for each failing test read its ` +
    `error-context.md (and any *.md accessibility snapshot) to see the real page tree at failure time.\n` +
    `For EACH failing test:\n` +
    `1. Classify the root cause — TEST-SIDE (locator/action/timing) vs PRODUCT BUG vs uncertain — and justify it ` +
    `in your FINAL REPLY (not in the code).\n` +
    `2. Fix ONLY the TEST-SIDE ones: correct the locator in the right page object under src/pages, or fix the ` +
    `action/wait in the spec at \`${specPath}\`, using the real roles/labels from the snapshot. Leave product ` +
    `bugs and uncertain cases untouched.\n` +
    `Write the COMPLETE updated file(s) with write_file (full content, not a diff): the spec at \`${specPath}\` ` +
    `and/or the page object(s) you changed. In your final reply, list each failure, its classification, and ` +
    `exactly what you changed (or why you left it).`
  );
}

/** Pull pass/fail counts out of the Playwright JSON reporter output. `unexpected: -1` = unparseable. */
function parseRunStats(resultsPath: string): { unexpected: number; expected: number; flaky: number; skipped: number } {
  try {
    const json = JSON.parse(readFileSync(resolve(REPO_ROOT, resultsPath), 'utf8'));
    const s = (json.stats ?? {}) as Record<string, number>;
    return {
      unexpected: s.unexpected ?? 0,
      expected: s.expected ?? 0,
      flaky: s.flaky ?? 0,
      skipped: s.skipped ?? 0,
    };
  } catch {
    return { unexpected: -1, expected: 0, flaky: 0, skipped: 0 };
  }
}

/**
 * Test-script self-heal loop, run right after the suite executes. While tests are failing
 * and cycles remain: hand the failures + Playwright error-context (the page snapshot at
 * failure) to the healer, which fixes only TEST-SIDE causes in the spec & page objects;
 * then deterministically RE-RUN the suite (overwriting the results JSON). Stops when the
 * suite is green, the results can't be parsed, or maxHeal cycles are hit — leaving any
 * remaining (likely product-bug) failures for the triage stage to classify.
 */
async function healAndRerun(specPath: string, resultsPath: string, project: string, maxHeal: number): Promise<void> {
  if (maxHeal <= 0) return;
  for (let attempt = 1; attempt <= maxHeal; attempt++) {
    const stats = parseRunStats(resultsPath);
    if (stats.unexpected < 0) {
      console.warn(`\n\x1b[33m⚠ Could not parse ${resultsPath}; skipping test self-heal.\x1b[0m`);
      return;
    }
    if (stats.unexpected === 0) {
      if (attempt === 1) console.log(`\n\x1b[32m✓ All tests passed — no healing needed.\x1b[0m`);
      return;
    }
    console.log(
      `\n\x1b[1;34m🔧 Heal pass ${attempt}/${maxHeal}:\x1b[0m ${stats.unexpected} failing test(s) — diagnosing & fixing test-side causes…`,
    );

    // 1) Fixer agent — repair only locator/action/wait issues in the spec + page objects.
    await runStage({
      name: `Heal #${attempt} · fix failing tests`,
      model: MODELS.script, // the strong model that wrote the spec owns the fix
      skill: HEALER_SKILL,
      inputs: [resultsPath, specPath, 'src/pages/base.page.ts', 'src/pages/item.list.page.ts', 'src/fixtures/fixture.ts'],
      output: specPath, // primary file; it may also rewrite page objects via write_file
      task: healTask(specPath, resultsPath),
    });

    // 2) Deterministically re-run the suite, overwriting the results JSON.
    await runStage({
      name: `Heal #${attempt} · re-run tests`,
      model: MODELS.run,
      skill: 'You run tests and report raw results faithfully. Do not edit code.',
      inputs: [specPath],
      output: resultsPath,
      selfWritesOutput: true,
      task:
        `Call run_playwright once with specPath="${specPath}", project="${project}", and outPath="${resultsPath}" ` +
        `— the tool writes the JSON itself. Then reply with the one-line summary it returns. Do NOT transcribe the JSON.`,
    });
  }

  const finalStats = parseRunStats(resultsPath);
  if (finalStats.unexpected > 0) {
    console.log(
      `\n\x1b[33m⚠ After ${maxHeal} heal pass(es), ${finalStats.unexpected} test(s) still failing — leaving them for the triage stage to classify.\x1b[0m`,
    );
  } else if (finalStats.unexpected === 0) {
    console.log(`\n\x1b[32m✓ All tests green after healing.\x1b[0m`);
  }
}

export interface PipelineInput {
  /** Path (relative to repo root) of the requirement document to test. */
  requirementPath: string;
  /** Where the generated spec should be written (relative to repo root). */
  specPath: string;
  /** 1-based stage to start from (resume). Default 1. */
  fromStage?: number;
  /** 1-based stage to stop after. Default = last stage. */
  toStage?: number;
  /** Skip the review gates and run straight through (old behaviour). */
  auto?: boolean;
  /** Open a visible browser window during the Explore stage (default headless). */
  headed?: boolean;
  /** Max self-heal reworks per review stage before finalizing as-is. Default DEFAULT_MAX_REWORK. */
  maxRework?: number;
  /** Max test-script heal cycles (fix + re-run) after the run stage. Default DEFAULT_MAX_HEAL; 0 disables. */
  maxHeal?: number;
}

type CheckpointAction = 'approve' | 'rerun' | 'quit';

/**
 * Human-in-the-loop gate. Pauses AFTER a stage so you can open `output` in your
 * editor, fix it, then choose what happens next. Because the next stage reads
 * this file fresh, your edits are picked up with zero extra tokens.
 */
async function checkpoint(stageNum: number, output: string, htmlPath?: string): Promise<CheckpointAction> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  console.log(`\n\x1b[1;35m⏸  Stage ${stageNum} produced:\x1b[0m ${output}`);
  if (htmlPath) console.log(`   \x1b[36mRead in browser:\x1b[0m ${htmlPath}   (edit the .md to change the next stage's input)`);
  console.log('   Review/edit that file now, then choose:');
  const ans = (
    await rl.question('   \x1b[1m[Enter]\x1b[0m approve & continue   \x1b[1mr\x1b[0m re-run this stage   \x1b[1mq\x1b[0m quit > ')
  )
    .trim()
    .toLowerCase();
  rl.close();
  if (ans === 'q' || ans === 'quit') return 'quit';
  if (ans === 'r' || ans === 'rerun') return 'rerun';
  return 'approve';
}

/** Artifact paths produced along the way (relative to repo root). */
const ART = {
  analysis: 'ai-orchestrator/artifacts/01-analysis.md',
  exploration: 'ai-orchestrator/artifacts/02-ui-exploration.md',
  manual: 'ai-orchestrator/artifacts/03-manual-testcases.md',
  // Structured suite (design/SCHEMA.md) written alongside the manual cases. It drives the
  // data-driven HTML screens: 03 → test-case detail, 06 → execution report (statuses merged
  // from the run). See html.ts / viewer.ts.
  suite: 'ai-orchestrator/artifacts/test-suite.json',
  results: 'ai-orchestrator/artifacts/05-results.json',
  report: 'ai-orchestrator/artifacts/06-report.md',
};

export async function runPipeline({
  requirementPath,
  specPath,
  fromStage = 1,
  toStage,
  auto = false,
  headed = false,
  maxRework = DEFAULT_MAX_REWORK,
  maxHeal = DEFAULT_MAX_HEAL,
}: PipelineInput): Promise<void> {
  exploreHeaded = headed;
  // All stages, in dependency order. Each reads the previous stage's artifact.
  const stages: StageOpts[] = [
  // ── Stage 1: Analyze requirement ───────────────────────────────────────────
  {
    name: '1/6 Analyze requirement',
    model: MODELS.analyze,
    review: true,
    // SKILL — who the agent is + how it must work.
    skill:
      'You are a senior QA analyst. You turn a feature requirement into a precise, ' +
      'testable analysis. Be concrete and avoid inventing behaviour not implied by the requirement.'+
      'Try to point out: test item, test behavior, test condition.' + 
      'Apply the following rules: ' +
      ' - Use equivalence partitioning to requirement about value: number, string, boolean, etc' + '\n' +
      ' - Use boundary value analysis to requirement about value: min, max, min-1, max+1, etc' + '\n' +
      ' - Use decision table to requirement about conditions: if-then-else, switch-case, etc' + '\n' +
      ' - Use state transition diagram to requirement about state: happy path, edge cases, etc' + '\n' +
      ' - Use use case to requirement describe the behavior of user or system' + '\n' +
      'When combine test item, test behavior, test condition, you can treat the one as 1 condition: eg: "sort" function has 3 values (low to high, high to low, top rated), "filter" function has 2 values (size, color). To combine them, apply decision table, so the total test case is 2*2 = 4 cases. However, with "sort" is "no/off/un-active", it means that test case only test filter function, not sort function. So the number of test case is 2*1 = 2 cases. Because these test cases test integration of two functions, not test each function separately. The test function is tested seperately in other test cases.' + '\n' +
      'COVERAGE & TRACEABILITY RULES (the reviewer grades you against these — follow them exactly):\n' +
      ' 1. TRACEABILITY IS MANDATORY. End the analysis with a **Traceability** table ' +
      '`| Source item | Covered by | Coverage type |`. List EVERY functional requirement (FR-n), EVERY row of the ' +
      'source "Acceptance criteria (examples)" table, AND every User Flow you wrote. `Covered by` = the AC id(s) ' +
      '(or flow id). `Coverage type` is one of: direct / decomposed / integration. If one source item is split ' +
      'across several ACs, list ALL of them. Nothing in the source may be absent from this table.\n' +
      ' 2. COMPOSITE SCENARIOS GET A DEDICATED INTEGRATION AC. When a single source scenario bundles several ' +
      'assertions in ONE row (e.g. "URL contains sort=3; only Size M products; highest price first"), create ONE ' +
      'integration AC that asserts the WHOLE bundle together — on top of any atomic ACs. Never scatter the ' +
      'assertions of one composite scenario across single-axis ACs with no combined AC.\n' +
      ' 3. PROCESS REQUIREMENTS NEED A DISCRIMINATING AC. If a requirement describes processing ORDER / how the ' +
      'system computes (not just the end state, e.g. "apply filters first, then sort"), write an AC with test ' +
      'data that would FAIL if the order were wrong (e.g. 10 products, 3 match the filter -> sorted result has ' +
      'exactly those 3), so the ordering rule itself is validated, not just its incidental outcome.\n' +
      ' 4. OUT OF SCOPE vs OPEN QUESTIONS. "Out of Scope" holds ONLY items the source explicitly excludes. Any ' +
      'area the source never mentions that you think deserves attention goes in a separate **Open Questions / ' +
      'Deferred (needs product sign-off)** section — NOT in Out of Scope — each noting the area, why you raise ' +
      'it, and who must decide. Do not present an analyst assumption as a product decision.\n' +
      ' 5. NO ORPHAN FLOWS. Every User Flow must map to at least one AC (and appear in the Traceability table). ' +
      'If a flow has no AC, either add the AC or drop the flow.\n' +
      ' 6. PERSISTENT QUANTIFIERS NEED TRANSITION + PERSISTENCE ACs. For any requirement worded "at all times / ' +
      'always / remains / preserves / does not clear / keeps", do NOT test only the first-achieved state. Add ' +
      'AC(s) covering the TRANSITION (after switching to another value) and PERSISTENCE (still correct after a ' +
      'later action). E.g. "selected sort is always visible" -> an AC asserting the label updates after switching ' +
      'sort=2 -> sort=4, not just after the first selection.\n' +
      ' 7. TAG EACH AC WITH A VERIFICATION LEVEL. Give every AC a level column/field: E2E (observable & ' +
      'reproducible through the live UI), API, unit, or mock. Mark ACs that depend on controlled data or ' +
      'internal algorithm details — e.g. stable tie-breaking (same price / same rating) and missing/invalid-price ' +
      'ordering — as API/unit/mock, NOT E2E, since they cannot be reliably exercised on the live catalog. This ' +
      'tells the UI-exploration stage exactly what to explore and what to skip.' ,

    // INPUT — files this stage reads.
    inputs: [requirementPath],
    // OUTPUT — single file this stage writes.
    output: ART.analysis,
    // TASK — what to produce + format.
    task:
      `Produce a structured analysis as Markdown with these sections:\n` +
      `- **Feature summary**\n- **In scope / Out of scope** (Out of Scope = source-stated exclusions only)\n` +
      `- **Open Questions / Deferred (needs product sign-off)** — areas the source never mentions that you flag for product review; write 'None' if there are none\n` +
      `- **User flows** (numbered)\n` +
      `- **Acceptance criteria** (testable, each with an ID AC-1, AC-2, ... and a Verification level E2E/API/unit/mock; include integration ACs for composite source scenarios and transition/persistence ACs for "always/remains" requirements)\n` +
      `- **Test data needed**\n- **Risks & edge cases**\n` +
      `- **Traceability** table \`| Source item | Covered by | Coverage type |\` covering every FR-n, every source AC-example row, and every User Flow\n` +
      `Keep it tight. This file is the sole input to the test-case writer.`,
  },

  // ── Stage 2: Explore the LIVE UI with a real browser (Playwright MCP) ────────
  {
    name: '2/6 Explore UI',
    model: MODELS.explore,
    browser: true,
    skill:
      'You are a QA engineer doing exploratory testing on a LIVE website with a real browser. ' +
      'You drive the browser with the Playwright MCP tools (navigate, click, type, select, and ' +
      'especially the accessibility `snapshot`). Your job is to discover how the feature ACTUALLY ' +
      'works in the UI so that test cases are grounded in reality, not guesses.\n' +
      'Method:\n' +
      '- Snapshot ONLY when the page meaningfully changed; never re-snapshot the same unchanged state. ' +
      'Reading the URL or one targeted evaluate is cheaper than a full snapshot — prefer it when you just ' +
      'need to confirm a param or a value.\n' +
      '- Record the EXACT visible labels, roles, and the real step-by-step flow you performed.\n' +
      '- Note the actual control type (dropdown vs buttons), default state, and any surprises.\n' +
      '- Exercise the feature end to end (you may click/type/select/submit) but do NOT log in, ' +
      'enter personal data, complete checkout, or submit payment.\n' +
      '- Report only what you observed; if something could not be found, say so explicitly.\n' +
      'SCOPE — explore ONLY what is observable and verifiable through the live UI:\n' +
      '- Explore: the sort control (type, labels, default state), each sort option and its URL `sort` param, ' +
      'the visible re-ordering of the grid, and sort×filter integration (URL params + which products remain).\n' +
      '- Do NOT explore scenarios the analysis flags as API/unit/mock-level or otherwise not UI-observable — in ' +
      'particular STABLE TIE-BREAKING (same price / same rating ordering) and MISSING/INVALID-PRICE ordering. ' +
      'These need controlled or mocked data, are not reliably reproducible on the live catalog, and reading the ' +
      'analysis Risks / Open Questions confirms they are deferred to API/unit tests. Skip them here; just note in ' +
      'the report that they are out of UI-exploration scope and why.\n' +
      '- If a scenario (e.g. a zero-result filter) cannot be reliably reached on the live site, do not burn budget ' +
      'forcing it — record that it was not reproducible and move on.\n' +
      'VERIFICATION-LEVEL RECONCILIATION — you are the ground truth for what is E2E-observable. The analysis\' ' +
      'E2E/API/unit tags are a PRELIMINARY guess made before seeing the real UI; your observations correct them. ' +
      'For EVERY AC the analysis tagged E2E, explicitly decide one of: CONFIRMED (the value/behaviour it asserts ' +
      'is visible on the UI, so it is genuinely E2E-verifiable) or DOWNGRADE (the UI does not surface what it ' +
      'asserts — e.g. rating value is not shown on product cards — so its un-observable part must move to ' +
      'API/unit). Record every DOWNGRADE with its evidence; do not leave any E2E-tagged AC unaddressed. A missed ' +
      'downgrade here forces the test-case stage to invent an unsourced deferral later.\n' +
      'BUDGET DISCIPLINE — you have a LIMITED action budget (~150 steps) and exceeding it loses all work:\n' +
      '- Cover the CORE scenarios first (each sort option + its URL param, the default/no-sort state, and ONE ' +
      'filter+sort integration); treat extra permutations as optional once the core is captured.\n' +
      '- WRITE the report to the output file EARLY with whatever you have, then refine it if budget remains. ' +
      'A partial report on disk is far better than losing everything to the turn cap.\n' +
      '- If you sense you are running low on budget, STOP exploring and write the report immediately, noting ' +
      'which scenarios you did not get to.',
    inputs: [ART.analysis, requirementPath, 'src/config/constant.enum.ts'],
    output: ART.exploration,
    task:
      `First read src/config/constant.enum.ts and navigate with the browser to EXACTLY the base URL ` +
      `\`AppUrl.Default\` / \`DEFAULT_BASE_URL\` (e.g. https://www.uniqlo.com/us/en/) — use that full URL, ` +
      `not a bare domain. Then exercise the feature described in the analysis. ` +
      `Write a UI exploration report as Markdown with:\n` +
      `- **Entry point** (URL + how to reach the feature)\n` +
      `- **Observed controls** table: | UI element | Role | Exact visible label | Notes |\n` +
      `- **Observed flows**: numbered real steps you performed for each main scenario (with the ` +
      `exact labels/roles to interact with)\n` +
      `- **Default state & behaviours actually seen**\n` +
      `- **Discrepancies vs the requirement** (anything different/missing on the real UI)\n` +
      `- **Out-of-UI-Exploration Scope**: ACs not exercised here and why (not UI-observable / needs mock data / not reproducible)\n` +
      `- **Verification-level reconciliation** table \`| AC | Analysis level | UI-observable? | Decision (CONFIRMED E2E / DOWNGRADE to API/unit) | Evidence |\` covering EVERY AC the analysis tagged E2E\n` +
      `- **Suggested locators** (role/text based) the script writer can reuse.\n` +
      `This grounds the manual test cases in the real UI.`,
  },

  // ── Stage 3: Write manual test cases (analysis + real UI exploration) ────────
  {
    name: '3/6 Write manual test cases',
    model: MODELS.manual,
    review: true,
    skill:
      'You are a QA engineer writing manual test cases for a human tester. Each case must be ' +
      'unambiguous, atomic, and traceable back to an acceptance criterion.' + '\n' +
      ' Prefer the EXACT labels, roles and flows recorded in the UI exploration report over any ' +
      'assumptions — those reflect the real website.' + '\n' +
      ' Test step need to be detailed and specific, eg: "Click on the "Login" button", "Fill "${value}" into "Username" textbox", ' + '\n' +
      ' Expected result need to be detailed and specific, eg: "User is logged in", "Error message is displayed", "User is redirected to the home page", etc' + '\n' +
      ' When test steps are duplicated in different test cases, use term "repeat step ${x} to ${y} in ${testcaseID}"' + '\n' +
      ' DEVIATIONS FROM ANALYSIS MUST BE RECORDED, NEVER BURIED. If the UI exploration shows an AC the analysis ' +
      'tagged E2E cannot actually be verified at E2E (e.g. the value it asserts is not surfaced anywhere in the ' +
      'UI), you MAY write the E2E test case to cover only the observable part and defer the rest to API/unit — ' +
      'but you MUST record that decision in a dedicated "Coverage deviations from analysis (needs upstream ' +
      'update)" section, NOT only in a test-case note. Each row: | AC | Analysis level | What you actually ' +
      'covered at E2E | Evidence from UI exploration | Recommended upstream fix (re-level the AC in analysis / ' +
      'add it to the exploration Out-of-UI-Scope) |. Never silently drop or downgrade an assertion.',
    inputs: [ART.analysis, ART.exploration],
    output: ART.manual,
    task:
      `Write manual test cases as a Markdown table with columns:\n` +
      `| ID | Title | Linked AC | Priority | Preconditions | Steps | Expected Result |\n` +
      `Use IDs TC-01, TC-02, ... Cover happy paths, the key edge cases and at least one negative case. ` +
      `Steps must use the real labels/flows from the UI exploration report.\n` +
      `If you cover any E2E-tagged AC only partially because the UI does not surface what it asserts, add a ` +
      `"Coverage deviations from analysis (needs upstream update)" section (table described in your skill); ` +
      `write 'None' if there are no deviations. This markdown file is the sole input to the script writer.\n\n` +
      `THEN also emit a STRUCTURED companion with write_file to exactly \`${ART.suite}\` — a single JSON ` +
      `object (conforming to design/SCHEMA.md) that mirrors the same cases so the viewer can render the ` +
      `test-case detail and execution-report screens. Shape:\n` +
      `- \`suite\`: { id, title, description, userStory }\n` +
      `- \`acceptanceCriteria\`: [{ id, num (e.g. "AC1"), short (3–5 words), text }] — one entry for EVERY AC any test case references\n` +
      `- \`testCases\`: [{ id, short (2–4 words), title, acs: [AC ids], tech: [one or more of BVA|EQP|DT|UC|ST|EG|PW], ` +
      `priority: High|Medium|Low, description, precondition, steps: [{ action, data, expected }] }]\n` +
      `OMIT \`status\` (the run stage fills it). Every \`acs\` value must match an \`acceptanceCriteria[].id\`. ` +
      `Keep the JSON and the Markdown table in sync (same TC ids, ACs, steps).`,
  },

  // ── Stage 4: Write Playwright script (manual cases + real locators + POM) ────
  {
    name: '4/6 Write Playwright script',
    model: MODELS.script,
    skill:
      'You are a Playwright + TypeScript automation engineer on a Page Object Model codebase. ' +
      'Rules:\n' +
      '- ALWAYS reuse the project fixture: `import { test, expect } from \'@fixtures/fixture\';` and the `appPage` fixture.\n' +
      '- Locators live in Page Objects under src/pages (which extend BasePage), NEVER inline in the spec. ' +
      'If a needed locator/method is missing, ADD it to the relevant page object with write_file before using it.\n' +
      '- Prefer the role/text-based locators recorded in the UI exploration report — they were verified on the live site.\n' +
      '- Import page objects via the `@pages/*` alias. Match the existing code style.\n' +
      '- Do not weaken assertions just to make tests pass.',
    inputs: [ART.manual, ART.exploration, 'src/pages/base.page.ts', 'src/pages/item.list.page.ts', 'src/fixtures/fixture.ts'],
    output: specPath,
    task:
      `Also run list_dir "src/pages" to discover all available page objects.\n` +
      `Implement the manual test cases as a Playwright spec, using the locators verified in the UI exploration report. ` +
      `Add any missing locators/methods to the appropriate page object before using them. ` +
      `Each test() must map to a TC id in its title, e.g. test('[TC-01] ...').`,
  },

  // ── Stage 5: Run the tests (depends on the spec) ────────────────────────────
  {
    name: '5/6 Run tests',
    model: MODELS.run,
    heal: true,
    skill: 'You run tests and report raw results faithfully. Do not edit code.',
    inputs: [specPath],
    output: ART.results,
    selfWritesOutput: true,
    task:
      `Call run_playwright once with specPath="${specPath}", project="chromium", and ` +
      `outPath="${ART.results}" — the tool writes the JSON to that file itself. ` +
      `Then reply with the one-line summary it returns. Do NOT read or transcribe the JSON yourself.`,
  },

  // ── Stage 6: Analyze results (depends on results + spec + cases) ─────────────
  {
    name: '6/6 Analyze results',
    model: MODELS.report,
    skill:
      'You are a QA lead triaging a test run. For each failure decide: real product bug, ' +
      'test/locator issue, or flaky — and justify it. Be specific and actionable.',
    inputs: [ART.results, specPath, ART.manual],
    output: ART.report,
    task:
      `Write a triage report as Markdown with:\n` +
      `- **Run summary** (counts, duration)\n- **Per-test result** table (TC id, status, notes)\n` +
      `- **Failure triage**: for each failure -> classification (product bug / test issue / flaky) + root cause + suggested fix\n` +
      `- **Coverage gaps** vs the acceptance criteria\n- **Recommended next actions**.`,
  },
  ];

  const total = stages.length;
  const start = Math.max(1, fromStage);
  const end = Math.min(total, toStage ?? total);

  if (start > 1) console.log(`\x1b[2m(resuming — skipping stages 1..${start - 1}, using their existing artifacts)\x1b[0m`);

  for (let i = start; i <= end; i++) {
    const stage = stages[i - 1];

    // Run this stage; allow re-running it in place until the user approves.
    // (Re-run is handy when you tweaked the stage's skill/task and want a fresh pass.)
    // eslint-disable-next-line no-constant-condition
    try {
    while (true) {
      await runStage(stage);

      const isMd = stage.output.toLowerCase().endsWith('.md');

      // Adversarial AI review + SELF-HEAL loop, BEFORE rendering HTML or the human
      // gate. The reviewer critiques the artifact; on FAIL the author investigates the
      // findings and fixes the genuinely-valid ones; repeat until PASS or maxRework.
      // Skipped in --auto (no human to read it). Runs even when this is the last stage
      // in range, since a single-stage run (e.g. --to 3) is exactly when you want it.
      if (stage.review && !auto) {
        await reviewAndRework(stage, maxRework, i);
      }

      // TEST-SCRIPT SELF-HEAL: after the run stage, fix test-side failures (locators/
      // actions) and re-run, up to maxHeal cycles, so the triage stage sees a result
      // that reflects genuine product behaviour, not avoidable script defects. Runs in
      // auto mode too — it is autonomous repair, not a human-gated review.
      if (stage.heal) {
        await healAndRerun(specPath, ART.results, 'chromium', maxHeal);
      }

      // Render the human-friendly HTML view ONLY NOW — after any self-heal — so the
      // .html always reflects the FINAL md artifact, never an intermediate draft.
      let htmlPath = isMd ? renderMarkdownToHtml(stage.output) : undefined;
      if (htmlPath) console.log(`\x1b[2m   ↳ HTML view: ${htmlPath}\x1b[0m`);

      // Rebuild the single combined viewer so it now includes every screen produced so far
      // (this stage's artifact + its review). Open ONE file — screens accumulate as you go.
      try { const v = buildSuiteViewer(); console.log(`\x1b[2m   ↳ Combined viewer: ${v}\x1b[0m`); } catch (e) { /* non-fatal */ }

      // No gate in auto mode, or after the final stage in range (nothing depends on it).
      if (auto || i === end) break;

      const action = await checkpoint(i, stage.output, htmlPath);
      // Re-render HTML in case the reviewer hand-edited the .md before approving.
      if (isMd) renderMarkdownToHtml(stage.output);
      if (action === 'approve') break;
      if (action === 'rerun') {
        console.log(`\x1b[2m↻ re-running stage ${i}...\x1b[0m`);
        continue;
      }
      // quit → tell the user how to resume later without re-spending tokens.
      console.log(`\n\x1b[33m■ Stopped after stage ${i}.\x1b[0m Artifacts so far are on disk.`);
      console.log(`  Resume from the next stage with:`);
      console.log(`    npx tsx run.ts ${requirementPath} ${specPath} --from ${i + 1}`);
      return;
    }
    } catch (err) {
      // A stage failed irrecoverably (transient retries exhausted, or a non-retryable
      // error). Completed stages are already persisted, so tell the user how to resume
      // from THIS stage instead of re-spending tokens on the ones that succeeded.
      console.error(`\n\x1b[31m✗ Stage ${i} (${stage.name}) failed and could not recover.\x1b[0m`);
      console.error(`  Artifacts from stages 1..${i - 1} are on disk. Resume from this stage with:`);
      console.error(`    npx tsx run.ts ${requirementPath} ${specPath} --from ${i}`);
      throw err;
    }
  }

  const html = (md: string) => md.replace(/\.md$/i, '.html');
  console.log(`\n\x1b[1;32m━━ Pipeline complete (stages ${start}..${end}) ━━\x1b[0m`);
  console.log(`  Analysis  : ${ART.analysis}   (read: ${html(ART.analysis)})`);
  console.log(`  UI explore: ${ART.exploration}   (read: ${html(ART.exploration)})`);
  console.log(`  Manual TC : ${ART.manual}   (read: ${html(ART.manual)})`);
  console.log(`  Spec      : ${specPath}`);
  console.log(`  Results   : ${ART.results}`);
  console.log(`  Report    : ${ART.report}   (read: ${html(ART.report)})`);
}
