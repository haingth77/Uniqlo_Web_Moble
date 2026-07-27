/**
 * Render a Markdown artifact to a human-friendly HTML file next to it.
 *
 * Markdown stays the canonical artifact (downstream stages read it; LLMs parse
 * Markdown far more reliably and cheaply than HTML). The .html is a read-only,
 * styled view for humans — generated, never hand-edited.
 *
 * Theme: the **Test Suite Viewer** design language — IBM Plex Sans + IBM Plex Mono
 * on a warm-grey (#e9ebef) canvas, content in a single white card, accent-header
 * tables, `oklch` callout boxes, One-Light syntax highlighting. Raw Markdown is
 * embedded in a <script type="text/markdown"> block and rendered client-side with
 * marked.js, so there is no extra npm dependency and no escaping headaches. Every
 * pipeline stage and `npm run render` emit this same format.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { REPO_ROOT } from './paths.ts';
import { renderSuiteScreen, statusesFromPlaywright, type Screen } from './viewer.ts';

/**
 * Artifacts that render as a data-driven Test Suite Viewer SCREEN instead of themed
 * Markdown. Each needs a sibling `test-suite.json` (see design/SCHEMA.md); if it is
 * missing we fall back to the Markdown render so a run never breaks.
 *   03-manual-testcases → 'testcase' detail screen
 *   06-report           → 'report' execution screen (statuses merged from 05-results.json)
 */
const SCREEN_ARTIFACTS: Record<string, Screen> = {
  '03-manual-testcases.md': 'testcase',
  '06-report.md': 'report',
};

const page = (title: string, markdown: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/atom-one-light.min.css" />
<script src="https://cdn.jsdelivr.net/npm/marked@12.0.0/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"></script>
<style>
  /* ===== Test Suite Viewer design language (light) ===== */
  :root {
    --font-sans: 'IBM Plex Sans', system-ui, -apple-system, sans-serif;
    --font-mono: 'IBM Plex Mono', 'SF Mono', Menlo, Consolas, monospace;
    --bg: #e9ebef; --card: #fff; --line: #d7dae0; --line-soft: #e4e7ec; --line-faint: #eef0f3;
    --ink: #15171d; --ink-2: #1a1c22; --text: #33394a; --text-soft: #454c5a; --muted: #8a93a2;
    --accent: oklch(0.5 0.13 255); --accent-soft: #f2f6fd;
    --code-bg: #f1f2f4; --code-text: #b0562f; --stripe: #f7f9fb;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--bg); color: var(--text);
    font-family: var(--font-sans); line-height: 1.7; font-size: 16px;
    -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
    zoom: 1.08;
  }
  @media (max-width: 860px) { body { zoom: 1; } }

  .wrap { max-width: 1080px; margin: 0 auto; padding: 38px clamp(14px, 3vw, 44px) 72px; }
  .card {
    background: var(--card); border: 1px solid var(--line); border-radius: 14px;
    box-shadow: 0 1px 2px rgba(20,24,33,.05), 0 12px 30px -14px rgba(20,24,33,.14);
    overflow: hidden;
  }
  .doc-head {
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    padding: 15px 22px; background: linear-gradient(180deg, #fbfcfd, #f4f6f8);
    border-bottom: 1px solid var(--line-soft);
  }
  .doc-id { font: 600 11px/1 var(--font-mono); color: #fff; background: var(--ink-2); padding: 5px 9px; border-radius: 6px; }
  .doc-tag { font: 500 11px/1.4 var(--font-mono); color: var(--muted); letter-spacing: .02em; }
  .doc-tag b { color: var(--accent); font-weight: 600; }

  .md { padding: 26px clamp(18px, 3vw, 44px) 42px; font-size: 16px; }
  .md > :first-child { margin-top: 0; }
  .md h1, .md h2, .md h3, .md h4 { font-family: var(--font-sans); font-weight: 700; line-height: 1.3; color: var(--ink); letter-spacing: -.012em; }
  .md h1 { font-size: 27px; color: var(--accent); border-bottom: 1px solid var(--line-soft); padding-bottom: .32em; margin: .1em 0 .7em; }
  .md h2 { font-size: 21px; border-bottom: 1px solid var(--line-faint); padding-bottom: .3em; margin: 1.9em 0 .6em; }
  .md h2::before { content: '§ '; color: var(--accent); font-family: var(--font-mono); font-weight: 500; font-size: .82em; }
  .md h3 { font-size: 17.5px; color: var(--accent); margin: 1.6em 0 .5em; }
  .md h4 { font-size: 15.5px; color: var(--text-soft); margin: 1.3em 0 .4em; }
  .md p, .md li { color: var(--text); }
  .md a { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 1px; }
  .md a:hover { text-decoration-thickness: 2px; }
  .md strong { color: var(--ink); font-weight: 600; }
  .md em { color: var(--text-soft); }
  .md hr { border: none; border-top: 1px dashed var(--line); margin: 2em 0; }
  .md ul, .md ol { padding-left: 1.4em; margin: .7em 0; }
  .md li { margin: .32em 0; }
  .md li::marker { color: var(--accent); }

  /* Inline code + code blocks */
  .md code { font-family: var(--font-mono); font-size: .84em; background: var(--code-bg); color: var(--code-text);
             padding: 2px 6px; border-radius: 5px; border: 1px solid var(--line-soft); }
  .md pre { background: #fafbfc; border: 1px solid var(--line-soft); border-radius: 10px; padding: 15px 17px;
            overflow-x: auto; font-size: 13px; line-height: 1.65; position: relative; }
  .md pre::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--accent); opacity: .4; border-radius: 10px 0 0 10px; }
  .md pre code { background: transparent; border: none; padding: 0; color: inherit; font-size: inherit; }

  /* Tables — accent header, striped, scroll inside the card if wide */
  .md table { border-collapse: collapse; width: 100%; margin: 1.1em 0; font-size: 14px; display: block; overflow-x: auto; }
  .md table thead { background: var(--ink-2); color: #fff; }
  .md table th, .md table td { padding: 9px 13px; border: 1px solid var(--line-soft); text-align: left; vertical-align: top;
                               color: var(--text); overflow-wrap: anywhere; }
  .md table thead th { color: #fff; font-weight: 600; }
  .md table tbody tr:nth-child(even) { background: var(--stripe); }

  /* Blockquote */
  .md blockquote { margin: 1.2em 0; padding: 11px 17px; border-left: 3px solid var(--muted); background: #f5f7f9;
                   color: var(--text-soft); border-radius: 0 9px 9px 0; }
  .md blockquote > :first-child { margin-top: 0; }
  .md blockquote > :last-child { margin-bottom: 0; }

  /* Callout boxes (GitHub-style alerts) — Test Suite Viewer oklch palette */
  .callout { margin: 1.2em 0; border-radius: 10px; border: 1px solid var(--line-soft);
             border-left: 3px solid var(--callout-color, var(--muted)); background: var(--callout-bg, #f5f7f9); padding: 13px 17px; }
  .callout-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
                    color: var(--callout-color, var(--muted)); font-weight: 700; font-size: 11.5px;
                    letter-spacing: .06em; text-transform: uppercase; font-family: var(--font-mono); }
  .callout-icon { font-size: 15px; }
  .callout-body { color: var(--text); }
  .callout-body > :first-child { margin-top: 0; }
  .callout-body > :last-child { margin-bottom: 0; }
  .callout-body code { background: #fff; }
  .callout-tip       { --callout-color: oklch(0.48 0.12 150); --callout-bg: oklch(0.965 0.03 150); }
  .callout-note      { --callout-color: oklch(0.5 0.13 255);  --callout-bg: oklch(0.965 0.03 255); }
  .callout-warning   { --callout-color: oklch(0.5 0.11 75);   --callout-bg: oklch(0.965 0.04 80); }
  .callout-danger    { --callout-color: oklch(0.52 0.16 25);  --callout-bg: oklch(0.965 0.03 25); }
  .callout-important { --callout-color: oklch(0.5 0.14 300);  --callout-bg: oklch(0.965 0.03 300); }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="doc-head">
      <span class="doc-id">${title}</span>
      <span class="doc-tag">GENERATED VIEW · edit the <b>.md</b> source, not this file</span>
    </div>
    <div id="body" class="md">Rendering…</div>
  </div>
</div>

<script type="text/markdown" id="src">
${markdown.replace(/<\/script>/gi, '<\\/script>')}
</script>
<script>
  const ALERT_TYPES = {
    TIP:       { icon: '💡', label: 'Tip',       cls: 'tip' },
    NOTE:      { icon: '📝', label: 'Note',      cls: 'note' },
    INFO:      { icon: 'ℹ️', label: 'Info',      cls: 'note' },
    WARNING:   { icon: '⚠️', label: 'Warning',   cls: 'warning' },
    GOTCHA:    { icon: '⚠️', label: 'Gotcha',    cls: 'warning' },
    CAUTION:   { icon: '🚨', label: 'Caution',   cls: 'danger' },
    DANGER:    { icon: '🚨', label: 'Danger',    cls: 'danger' },
    IMPORTANT: { icon: '⭐', label: 'Important', cls: 'important' },
    KEY:       { icon: '🔑', label: 'Key',       cls: 'important' }
  };
  const renderer = new marked.Renderer();
  const origBlockquote = renderer.blockquote.bind(renderer);
  renderer.blockquote = function (quote) {
    const m = quote.match(/^\\s*<p>\\s*\\[!(\\w+)\\]\\s*([\\s\\S]*?)<\\/p>([\\s\\S]*)/);
    if (m) {
      const t = ALERT_TYPES[m[1].toUpperCase()];
      if (t) {
        const head = m[2].trim();
        const body = (head ? '<p>' + head + '</p>' : '') + m[3];
        return '<div class="callout callout-' + t.cls + '">'
          + '<div class="callout-header"><span class="callout-icon">' + t.icon + '</span><span>' + t.label + '</span></div>'
          + '<div class="callout-body">' + body + '</div></div>';
      }
    }
    return origBlockquote(quote);
  };
  marked.setOptions({ gfm: true, breaks: false, renderer: renderer });

  const src = document.getElementById('src').textContent.trim();
  const target = document.getElementById('body');
  target.innerHTML = marked.parse(src);
  target.querySelectorAll('pre code').forEach(function (el) {
    try { hljs.highlightElement(el); } catch (_) {}
  });
</script>
</body>
</html>
`;

/**
 * Read `mdRelPath` (repo-root-relative), write a sibling `.html`, return its
 * repo-root-relative path. Safe to call right after a stage writes its .md.
 */
export function renderMarkdownToHtml(mdRelPath: string): string {
  const htmlRelPath = mdRelPath.replace(/\.md$/i, '.html');
  const title = mdRelPath.split('/').pop() ?? 'document';
  const dir = dirname(mdRelPath);
  const base = basename(mdRelPath);

  // Data-driven screens (test cases, execution report) render from a sibling test-suite.json.
  const screen = SCREEN_ARTIFACTS[base];
  const suiteRel = `${dir}/test-suite.json`;
  if (screen && existsSync(resolve(REPO_ROOT, suiteRel))) {
    const suite = JSON.parse(readFileSync(resolve(REPO_ROOT, suiteRel), 'utf8'));
    if (screen === 'report') {
      // Prefer real run statuses from the Playwright reporter when present.
      const resultsRel = `${dir}/05-results.json`;
      if (existsSync(resolve(REPO_ROOT, resultsRel))) {
        const byId = statusesFromPlaywright(resultsRel);
        for (const tc of suite.testCases ?? []) if (byId[tc.id]) tc.status = byId[tc.id];
      }
    }
    writeFileSync(resolve(REPO_ROOT, htmlRelPath), renderSuiteScreen(title, suite, screen), 'utf8');
    return htmlRelPath;
  }

  // Fallback: themed-Markdown view.
  const markdown = readFileSync(resolve(REPO_ROOT, mdRelPath), 'utf8');
  writeFileSync(resolve(REPO_ROOT, htmlRelPath), page(title, markdown), 'utf8');
  return htmlRelPath;
}
