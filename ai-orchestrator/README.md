# AI QA Orchestrator (prototype)

A deterministic multi-stage QA pipeline built on the **Claude Agent SDK**
(`@anthropic-ai/claude-agent-sdk`). It turns a plain-English requirement into a
running Playwright test and a triage report, one dependent stage at a time.

```
requirements/*.md
   │
   ▼ ① Analyze requirement   → artifacts/01-analysis.md  (+ .html)
   ▼ ② Explore UI (live!)     → artifacts/02-ui-exploration.md  (+ .html)   [real browser via Playwright MCP]
   ▼ ③ Write manual cases     → artifacts/03-manual-testcases.md  (+ .html)
   ▼ ④ Write Playwright spec  → tests/e2e/ai-generated/<name>.spec.ts   (uses your POM + fixture)
   ▼ ⑤ Run tests              → artifacts/05-results.json
   ▼ ⑥ Analyze run            → artifacts/06-report.md  (+ .html)
```

**Stage ② Explore UI** drives a *real browser* against the live site (Microsoft's
[Playwright MCP](https://github.com/microsoft/playwright-mcp) server) to discover the
actual flow, labels, roles and edge cases — so the manual cases (③) and the script (④)
are grounded in the real UI instead of guessed from the requirement text. It may
click/type/select/submit, but is instructed **not** to log in, enter personal data, or
complete checkout/payment. Browser tools are enabled **only** in this stage (per-stage
permission gate); every other stage stays sandboxed to the 4 QA file/run tools.

**Prerequisite:** the first run downloads the Playwright MCP server via `npx` (needs
network). On Windows, if spawning `npx` fails, change `PLAYWRIGHT_SERVER.command` in
`pipeline.ts` to `'npx.cmd'`.

**Output formats.** Markdown is the *canonical* artifact: downstream stages read it, and
LLMs parse Markdown far more reliably and cheaply than HTML. For each Markdown artifact the
pipeline also auto-renders a styled **`.html`** sibling (via `html.ts`) for comfortable human
reading — **Catppuccin Mocha** dark theme, Inter + JetBrains Mono, One Dark Pro syntax
highlighting, and GitHub-style callout boxes (`> [!TIP]`, `> [!WARNING]`, …), all rendered
client-side with marked.js + highlight.js from CDN (no extra npm dependency).
**Edit the `.md`** to change a stage's input — the `.html` is a generated view, overwritten
on each run/approve.

### Re-render HTML without spending tokens

After hand-editing a `.md`, or after tweaking the theme in `html.ts`, regenerate the HTML
with no API calls:

```bash
npm run render                                    # default artifacts (analysis, manual, report)
npm run render -- ai-orchestrator/artifacts/01-analysis.md   # specific file(s)
```

Each stage is one Claude agent — a focused `query()` call with its own system
prompt, model, and a small toolset. The **order is enforced in code** (`pipeline.ts`)
because every stage's input is the previous stage's artifact, exactly as required:
analysis feeds the manual cases, the manual cases feed the script.

By default the pipeline **pauses after every stage** (human-in-the-loop) so you can
review, hand-edit the artifact, and approve before spending tokens on the next stage.

## Editing a stage: skill / input / output

Every stage is a declarative block in `pipeline.ts` (`stages` array). To customize
a stage you only touch four fields — no need to rewrite the prompt:

| Field     | Meaning                                                      |
|-----------|--------------------------------------------------------------|
| `skill`   | Who the agent is + the method/rules it must follow (system prompt) |
| `inputs`  | File paths (repo-root-relative) the agent reads first         |
| `output`  | The single file the stage must write                          |
| `task`    | The concrete instruction + output format                      |

`runStage()` assembles the prompt from `inputs`/`task`/`output` automatically.
For a long, reusable skill, keep `skill` short and put the detailed method in a
file under `skills/`, then add that file to `inputs`.

## How it maps to the Agent SDK concepts

| Concept            | Where in this prototype                                        |
|--------------------|----------------------------------------------------------------|
| Orchestrator       | `runPipeline()` in `pipeline.ts` — drives stage order          |
| Agent / sub-agent  | each `runStage()` = one `query()` with a dedicated system prompt|
| Tools              | `tools.ts` — `read_file`, `list_dir`, `write_file`, `run_playwright` via `createSdkMcpServer` |
| External MCP       | `PLAYWRIGHT_SERVER` — Microsoft Playwright MCP (stdio) attached only to the Explore stage |
| Permission control | per-stage `gate` (`canUseTool`) — QA tools always; browser tools only in the Explore stage; everything else denied |
| Model routing      | `MODELS` — Haiku for the mechanical run step, Opus for script authoring |

## Run it

```bash
cd ai-orchestrator
npm install                          # first time only
npx playwright install chromium      # first time only

# Auth — pick ONE:
#  A) Use your Claude subscription (Pro/Max/Team) — usually cheaper:
claude setup-token                   # logs in, prints a token
export CLAUDE_CODE_OAUTH_TOKEN=<token>
unset ANTHROPIC_API_KEY              # API key would otherwise take precedence
#  B) Or a pay-per-token API key from console.anthropic.com:
export ANTHROPIC_API_KEY=sk-ant-...

# uses the bundled sample requirement
npm run orchestrate

# or point it at your own requirement (+ optional spec output path)
npm run orchestrate -- ai-orchestrator/requirements/my-feature.md tests/e2e/ai-generated/my-feature.spec.ts
```

> **Paths are resolved relative to the REPO ROOT**, not this folder (the tools sandbox
> to `REPO_ROOT`). Always pass `ai-orchestrator/requirements/...`, even when your shell
> is inside `ai-orchestrator/`.

The CLI args:

| Arg / flag             | Effect                                                           |
|------------------------|------------------------------------------------------------------|
| `<requirementPath>`    | 1st positional — the requirement doc to test                     |
| `[specPath]`           | 2nd positional — where to write the spec (default: `tests/e2e/ai-generated/<name>.spec.ts`) |
| `--from <n>`           | Start at stage *n* (1–6) — **resume** using existing artifacts   |
| `--to <n>`             | Stop after stage *n*                                             |
| `--auto`, `-y`         | Run straight through with **no review gates**                    |
| `--headed`             | Explore stage opens a **visible** browser so you can watch (default: headless) |

> [!IMPORTANT]
> When passing `--from/--to`, run **`npx tsx run.ts …`** rather than `npm run orchestrate -- …`.
> `npm` swallows the `--from/--to` flags before they reach the script.

Playwright itself runs from the **repo root** (so `playwright.config.ts`, the
`@pages/@fixtures` aliases, and browsers all resolve).

## Review / edit / approve workflow (default)

After each stage the pipeline pauses:

```
⏸  Stage 1 produced: ai-orchestrator/artifacts/01-analysis.md
   Review/edit that file now, then choose:
   [Enter] approve & continue   r re-run this stage   q quit >
```

| You do                  | What happens                                              | Tokens |
|-------------------------|-----------------------------------------------------------|--------|
| Edit the file, then `Enter` | Next stage reads your hand-edited file                 | **0** — the cheapest fix |
| `r`                     | Re-runs this stage from scratch (use after you tweak its `skill`/`task` in code) | spends this stage's tokens |
| `q`                     | Stops and prints the exact command to resume later        | 0 |

Because every stage reads its input fresh from disk, **editing an artifact and
approving costs no tokens** — that is the whole point of the gate.

### Resume without re-running earlier stages

On `q` the tool prints a ready-to-paste resume command, e.g. stopped after stage 3:

```bash
npx tsx run.ts ai-orchestrator/requirements/my-feature.md tests/e2e/ai-generated/my-feature.spec.ts --from 4
```

`--from 4` skips stages 1–3 and reuses their on-disk artifacts (including your edits).

### Run a single stage at a time

```bash
# ① analyze, inspect 01-analysis.md, fix it
npx tsx run.ts ai-orchestrator/requirements/my-feature.md --to 1
# ② explore the live UI, review 02-ui-exploration.md
npx tsx run.ts ai-orchestrator/requirements/my-feature.md --from 2 --to 2
# ③ write manual cases, review 03-manual-testcases.md
npx tsx run.ts ai-orchestrator/requirements/my-feature.md --from 3 --to 3
```

> The review gate uses an **interactive terminal** (`readline`). If you run the
> orchestrator with non-interactive stdin (e.g. piped, or via Claude's `!` prefix),
> the prompt can't accept input — drive it with `--from/--to` (one stage per run) or
> `--auto` instead.

## Safety notes (prototype)

- The agents can only touch files **inside the repo** and can only run Playwright —
  no raw shell, no network calls. That boundary is `tools.ts` + the `gate` callback.
- Stage ③ may **edit your page objects** (to add missing locators). Review the diff
  before committing — treat generated tests as a draft, not gospel.
- LLMs tend to write tests that pass. Stage ⑤ is a first triage pass; for real use,
  add an adversarial "does this test actually assert the AC?" reviewer agent.

## Next steps to harden

1. **Self-heal loop**: if stage ④ fails, loop ③→④ up to N times feeding the failure back.
2. **Structured output**: have stages emit JSON (validated) instead of Markdown for machine hand-off.
3. **Adversarial verifier**: a 6th agent that checks each test truly covers its linked AC.
4. **Parallel fan-out**: split manual cases into batches and author specs concurrently.