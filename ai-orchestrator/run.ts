/**
 * Entry point. Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... npm run orchestrate -- <requirementPath> [specPath] [flags]
 *
 * Flags:
 *   --from <n>        start at stage n (1..5) — resume without re-running earlier stages
 *   --to   <n>        stop after stage n
 *   --auto, -y        run straight through, no review gates between stages
 *   --max-rework <n>  self-heal cap per review stage (default 2): review→fix→re-review until PASS or n reworks
 *   --max-heal <n>    test-script heal cap after the run stage (default 2): fix locators/actions→re-run until green or n cycles (0 disables)
 *
 * By default the pipeline PAUSES after each stage so you can review/edit the
 * artifact before the next stage runs. Defaults to the bundled sample requirement.
 */
import { runPipeline } from './pipeline.ts';

const argv = process.argv.slice(2);

// Split flags from positionals.
const positionals: string[] = [];
let fromStage: number | undefined;
let toStage: number | undefined;
let auto = false;
let headed = false;
let maxRework: number | undefined;
let maxHeal: number | undefined;

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--auto' || a === '-y') auto = true;
  else if (a === '--headed') headed = true;
  else if (a === '--from') fromStage = Number(argv[++i]);
  else if (a === '--to') toStage = Number(argv[++i]);
  else if (a === '--max-rework') maxRework = Number(argv[++i]);
  else if (a === '--max-heal') maxHeal = Number(argv[++i]);
  else positionals.push(a);
}

const requirementPath = positionals[0] ?? 'ai-orchestrator/requirements/item-list-filter.md';

// Derive a spec file name from the requirement file name, written under a dedicated folder.
const base =
  requirementPath
    .split('/')
    .pop()!
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9-]+/gi, '-')
    .toLowerCase() || 'generated';
const specPath = positionals[1] ?? `tests/e2e/ai-generated/${base}.spec.ts`;

// Auth: either a Claude subscription OAuth token (run `claude setup-token`) OR a
// pay-per-token API key from console.anthropic.com. If both are set, the API key wins.
if (!process.env.CLAUDE_CODE_OAUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
  console.error('✗ No credentials found. Set ONE of:');
  console.error('  • CLAUDE_CODE_OAUTH_TOKEN  (use your Claude subscription — run `claude setup-token`)');
  console.error('  • ANTHROPIC_API_KEY        (pay-per-token key from console.anthropic.com)');
  process.exit(1);
}
if (process.env.CLAUDE_CODE_OAUTH_TOKEN && process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠ Both CLAUDE_CODE_OAUTH_TOKEN and ANTHROPIC_API_KEY are set; the API key takes precedence.');
  console.warn('  Run `unset ANTHROPIC_API_KEY` to use your subscription instead.');
}

console.log(`Requirement : ${requirementPath}`);
console.log(`Target spec : ${specPath}`);
console.log(`Mode        : ${auto ? 'auto (no gates)' : 'review after each stage'}`);
if (fromStage || toStage) console.log(`Stages      : ${fromStage ?? 1}..${toStage ?? 6}`);
if (!auto) console.log(`Self-heal   : up to ${maxRework ?? 2} rework(s) per review stage`);
console.log(`Heal tests  : up to ${maxHeal ?? 2} fix+re-run cycle(s) after the run stage`);

if (headed) console.log(`Explore     : headed (visible browser)`);

runPipeline({ requirementPath, specPath, fromStage, toStage, auto, headed, maxRework, maxHeal }).catch((err) => {
  console.error('\n✗ Pipeline failed:', err);
  process.exit(1);
});
