/**
 * Re-render Markdown artifacts to HTML — NO API calls, 0 tokens.
 *
 * Usage:
 *   npm run render                       # re-render the default artifacts (analysis, manual, report)
 *   npm run render -- path/to/file.md    # re-render specific .md files (repo-root-relative)
 *
 * Handy after you hand-edit a .md, or after you tweak the theme in html.ts.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { REPO_ROOT } from './paths.ts';
import { renderMarkdownToHtml } from './html.ts';
import { buildSuiteViewer } from './build-suite-viewer.ts';

// The full set of Markdown artifacts a run produces. `01-analysis` and its review are
// deliberately EXCLUDED from the default bulk re-render: they are hand-authored, data-driven
// interactive views (traceability panels + coverage matrix) rather than a themed Markdown
// render, so a blind re-render would flatten them. Re-render them explicitly if you want the
// themed-Markdown fallback instead: `npm run render -- ai-orchestrator/artifacts/01-analysis.md`.
const DEFAULTS = [
  'ai-orchestrator/artifacts/02-ui-exploration.md',
  'ai-orchestrator/artifacts/03-manual-testcases.md',
  'ai-orchestrator/artifacts/03-manual-testcases.review.md',
  'ai-orchestrator/artifacts/05-failures.md',
  'ai-orchestrator/artifacts/06-report.md',
];

const targets = process.argv.slice(2);
const list = targets.length ? targets : DEFAULTS;

let rendered = 0;
for (const md of list) {
  if (!md.toLowerCase().endsWith('.md')) {
    console.warn(`• skip (not .md): ${md}`);
    continue;
  }
  if (!existsSync(resolve(REPO_ROOT, md))) {
    console.warn(`• skip (missing): ${md}`);
    continue;
  }
  const html = renderMarkdownToHtml(md);
  console.log(`✓ ${md} → ${html}`);
  rendered++;
}
const viewer = buildSuiteViewer();
console.log(`\nRendered ${rendered} file(s) + combined viewer → ${viewer}. 0 tokens spent.`);
