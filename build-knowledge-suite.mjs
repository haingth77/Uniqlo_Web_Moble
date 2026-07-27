/**
 * build-knowledge-suite.mjs — QA Automation knowledge base, "Suite" identity.
 *
 * Design lead brief (fresh, not derived from the other two builds):
 *   Concept  : the knowledge base rendered as a TEST RUNNER. QA's own vernacular
 *              — specs, runs, pass ticks, coverage, terminal output — is the material.
 *   Palette  : Anthropic DARK ground #141413 · clay #d97757 (active) · green #788c5d (pass)
 *              · blue #6a9bcc (info). Light theme = warm cream. No invented red.
 *   Type     : Poppins (display) + Lora (body) + Space Mono (chrome/labels).
 *              Deliberate contrast: cold instrument shell, warm serif prose inside.
 *   Layout   : editor-TAB navigation (no sidebar) · dashboard "run summary" home ·
 *              centered reading sheet + right mini-map · top reading-progress hairline.
 *   Signature: home streams a live test-run (✓ spec … ✓ spec …) that resolves all-green
 *              on load — one orchestrated moment, reduced-motion respected.
 *
 * Content in content/ is rendered verbatim (never edited).
 *
 * Run:  node build-knowledge-suite.mjs
 * Out:  knowledge.html   ← this is the canonical viewer that ships in the repo
 */

import fs from 'fs';

const CONTENT_DIR = 'content';
const CLAY = '#d97757', BLUE = '#6a9bcc', GREEN = '#788c5d';

/* Each doc is a "spec" in the suite. `spec` = runner filename motif. */
const CATEGORIES = [
  { id: 'home',                title: 'Index',               sub: 'Run summary — bắt đầu ở đây',                  accent: CLAY,  spec: 'suite.config',        file: null },
  { id: 'interview-answers',   title: 'Interview Answers',   sub: 'Middle QA Automation — 198 câu trả lời',       accent: CLAY,  spec: 'answers.spec.ts',      file: 'qa_automation_interview_answers.md' },
  { id: 'interview-questions', title: 'Interview Questions', sub: 'Bộ câu hỏi phỏng vấn — 198 câu',                accent: BLUE,  spec: 'questions.spec.ts',    file: 'qa_automation_interview_questions.md' },
  { id: 'playwright-note',     title: 'Playwright Notes',    sub: 'Ghi chú thực hành Playwright',                 accent: GREEN, spec: 'playwright.notes',     file: 'Playwright_note.md' },
  { id: 'playwright-locator',  title: 'Playwright Locators', sub: 'Locator strategy & best practices',            accent: CLAY,  spec: 'locators.strategy',    file: 'PLAYWRIGHT_LOCATOR.md' },
  { id: 'jenkins',             title: 'CI/CD Jenkins',       sub: 'Pipeline, Docker, agent setup',                accent: BLUE,  spec: 'cicd.pipeline',        file: 'CICD_Jenkins_knowledge.md' },
  { id: 'ci-flows',            title: 'CI Flows Diagram',    sub: 'Docker build + Jenkinsfile — sơ đồ từng bước', accent: GREEN, spec: 'ci.flows.diagram',     file: 'CI_FLOWS.html', rawHtml: true },
  { id: 'gitops-argocd',       title: 'Jenkins vs Argo CD',  sub: 'CI mệnh lệnh vs CD khai báo (GitOps)',         accent: BLUE,  spec: 'gitops.argocd',        file: 'gitops_argocd.md' },
  { id: 'js-study',            title: 'JS Study Guide',      sub: 'Async, closures, this, OOP, event loop, TS',   accent: CLAY,  spec: 'javascript.guide',     file: 'js_study_guide.md' },
  { id: 'js-data-structures',  title: 'JS Data Structures',  sub: 'Hash Map, Hash Set, Stack, Queue — API + bẫy', accent: GREEN, spec: 'datastructures.js',    file: 'js_data_structures.md' },
  { id: 'algo-patterns',       title: 'Coding Patterns',     sub: 'Two Pointers, Hash, Stack, Binary Search, List', accent: CLAY, spec: 'algo.patterns',       file: 'dsa_patterns.md' },
  { id: 'leetcode-review',     title: 'LeetCode Review',     sub: '17 bài đã giải — bẫy đã vướng, pattern recall', accent: BLUE,  spec: 'leetcode.review',      file: 'leetcode_review.md' },
  { id: 'sql-knowledge',       title: 'SQL Knowledge',       sub: 'SELECT → JOIN → CRUD, bẫy NULL & QA habit',    accent: GREEN, spec: 'sql.queries',          file: 'sql_knowledge.md' },
  { id: 'design-patterns',     title: 'Design Patterns',     sub: 'SOLID, DRY, GoF trong test framework',         accent: BLUE,  spec: 'patterns.solid',       file: 'design_patterns.md' },
  { id: 'ai-orchestrator',     title: 'AI QA Orchestrator',  sub: 'Multi-agent pipeline — Agent SDK',             accent: GREEN, spec: 'ai.orchestrator',      file: 'ai_orchestrator.md' },
  { id: 'testing-craft',       title: 'Testing Craft',       sub: 'BDD, test doubles, contract testing',          accent: CLAY,  spec: 'testing.craft',        file: 'testing_craft.md' },
  { id: 'git-advanced',        title: 'Git Advanced',        sub: 'Branching, rebase, rescue commands',           accent: BLUE,  spec: 'git.advanced',         file: 'git_advanced.md' },
  { id: 'kafka',               title: 'Kafka Knowledge',     sub: 'Event streaming cho QA — delivery semantics',  accent: GREEN, spec: 'kafka.streaming',      file: 'kafka_knowledge.md' },
  { id: 'k8s-ci-autotest',     title: 'K8s + CI Autotest',   sub: 'Dockerized Playwright runner: K8s Job, EKS, GitHub Actions, Jira', accent: CLAY, spec: 'k8s.autotest', file: 'k8s_cicd_autotest_knowledge.md' },
];

const docs = CATEGORIES.map((c, i) => {
  let content = '';
  const fp = c.file ? `${CONTENT_DIR}/${c.file}` : null;
  if (fp && fs.existsSync(fp)) content = fs.readFileSync(fp, 'utf8');
  else if (fp) console.warn('  ! missing source: ' + fp);
  const words = content && !c.rawHtml ? content.split(/\s+/).filter(Boolean).length : 0;
  return { ...c, idx: i, content, words };
});

const payload = JSON.stringify(docs).replace(/<\/script>/gi, '<\\/script>');

const html = `<!DOCTYPE html>
<html lang="vi" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>QA Suite — Knowledge Runner</title>
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Space+Mono:wght@400;700&display=swap">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/atom-one-dark.min.css" id="hljs-dark">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/atom-one-light.min.css" id="hljs-light" disabled>
<script src="https://cdn.jsdelivr.net/npm/marked@12.0.0/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"></script>
<style>
:root {
  --font-display: 'Poppins', 'Arial', system-ui, sans-serif;
  --font-body: 'Lora', Georgia, 'Times New Roman', serif;
  --font-mono: 'Space Mono', 'IBM Plex Mono', 'SF Mono', Menlo, monospace;

  /* ===== Suite (dark) — Anthropic charcoal instrument shell, default ===== */
  --bg: #141413;
  --bg-2: #1a1917;
  --panel: #1d1c19;
  --panel-2: #232220;
  --line: #34322c;
  --line-soft: #2a2823;
  --text: #faf9f5;
  --soft: #cbc8bd;
  --mute: #8f897b;

  --clay: #e2896b;      /* clay lifted for dark contrast */
  --clay-ink: #1a1917;
  --pass: #9cb67f;      /* green #788c5d family — "passing" */
  --info: #8bb2dc;      /* blue #6a9bcc family — links/info */
  --accent: var(--clay);
  --accent-soft: rgba(226,137,107,0.14);

  --code-bg: #131211;
  --code-text: #ecab8c;
  --stripe: #201f1c;
  --term-bg: #0f0e0d;
  --shadow: 0 1px 2px rgba(0,0,0,.5), 0 18px 44px rgba(0,0,0,.42);

  --tip: #9cb67f;    --tip-bg: rgba(120,140,93,.15);
  --note: #8bb2dc;   --note-bg: rgba(106,155,204,.14);
  --warn: #d5a35f;   --warn-bg: rgba(176,121,58,.15);
  --danger: #e08a68; --danger-bg: rgba(217,119,87,.14);
  --imp: #e2896b;    --imp-bg: rgba(217,119,87,.15);
  --quote: #a29d90;  --quote-bg: rgba(162,157,144,.08);

  --header-h: 58px;
  --tabs-h: 46px;
}
[data-theme="light"] {
  /* ===== Suite (light) — warm Anthropic paper ===== */
  --bg: #faf9f5;
  --bg-2: #f4f1ea;
  --panel: #fffefb;
  --panel-2: #f4f1e8;
  --line: #e4e0d3;
  --line-soft: #ede9dd;
  --text: #141413;
  --soft: #4a463d;
  --mute: #8a8578;

  --clay: #d97757;
  --clay-ink: #ffffff;
  --pass: #5f7346;
  --info: #4f7bab;
  --accent: var(--clay);
  --accent-soft: rgba(217,119,87,0.12);

  --code-bg: #f3efe4;
  --code-text: #b0562f;
  --stripe: #faf7ef;
  --term-bg: #201f1c;   /* terminal stays dark even in light mode — it's a screen */
  --shadow: 0 1px 2px rgba(20,20,19,.05), 0 14px 34px rgba(20,20,19,.10);

  --tip: #5f7346;   --tip-bg: rgba(120,140,93,.12);
  --note: #4f7bab;  --note-bg: rgba(106,155,204,.13);
  --warn: #a9722a;  --warn-bg: rgba(176,121,58,.12);
  --danger: #c0563a;--danger-bg: rgba(192,86,58,.11);
  --imp: #c25a3a;   --imp-bg: rgba(217,119,87,.12);
  --quote: #8a8578; --quote-bg: rgba(138,133,120,.08);
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--text);
  line-height: 1.72;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}
/* faint instrument-grid backdrop: dotted coordinate field */
.backdrop {
  position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background-color: var(--bg);
  background-image:
    radial-gradient(60% 40% at 100% 0%, rgba(217,119,87,0.07), transparent 66%),
    radial-gradient(50% 40% at 0% 100%, rgba(106,155,204,0.05), transparent 70%),
    radial-gradient(circle at center, var(--line-soft) 1px, transparent 1px);
  background-size: cover, cover, 26px 26px;
}
a { color: inherit; }

/* ===== READING PROGRESS (top hairline) ===== */
.progress { position: fixed; top: 0; left: 0; right: 0; height: 2px; z-index: 80; background: transparent; }
.progress i { display: block; height: 100%; width: 0; background: var(--accent); transition: width .1s linear; }

/* ===== HEADER ===== */
header {
  position: sticky; top: 0; z-index: 70; height: var(--header-h);
  display: flex; align-items: center; gap: 14px; padding: 0 20px;
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}
.brand { display: flex; align-items: center; gap: 11px; flex: 1; min-width: 0; cursor: pointer; }
.brand .live { position: relative; width: 9px; height: 9px; flex-shrink: 0; }
.brand .live::before { content: ''; position: absolute; inset: 0; border-radius: 50%; background: var(--pass); }
.brand .live::after { content: ''; position: absolute; inset: -4px; border-radius: 50%; border: 1px solid var(--pass); opacity: .5; animation: ping 2.4s ease-out infinite; }
@keyframes ping { 0% { transform: scale(.7); opacity: .6; } 100% { transform: scale(1.9); opacity: 0; } }
.brand .word { font-family: var(--font-display); font-weight: 700; font-size: 15.5px; letter-spacing: .01em; white-space: nowrap; }
.brand .word b { color: var(--accent); }
.brand .crumb { font-family: var(--font-mono); font-size: 12px; color: var(--mute); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.brand .crumb::before { content: '/ '; color: var(--line); }
@media (max-width: 620px) { .brand .crumb { display: none; } }

.cmd-hint {
  display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
  font-family: var(--font-mono); font-size: 12px; color: var(--soft);
  background: var(--panel); border: 1px solid var(--line); padding: 6px 11px; border-radius: 8px;
  transition: border-color .15s, color .15s;
}
.cmd-hint:hover { border-color: var(--accent); color: var(--accent); }
.cmd-hint kbd { font-family: var(--font-mono); font-size: 11px; background: var(--panel-2); border: 1px solid var(--line); border-radius: 4px; padding: 0 5px; }
@media (max-width: 520px) { .cmd-hint .txt { display: none; } }
.icon-btn { background: var(--panel); border: 1px solid var(--line); color: var(--text); width: 36px; height: 36px; border-radius: 8px; cursor: pointer; font-size: 15px; display: grid; place-items: center; transition: border-color .15s, color .15s; }
.icon-btn:hover { border-color: var(--accent); color: var(--accent); }

/* ===== TAB BAR (editor tabs = section nav) ===== */
.tabs {
  position: sticky; top: var(--header-h); z-index: 65; height: var(--tabs-h);
  display: flex; align-items: stretch; gap: 2px; padding: 0 12px;
  background: var(--bg-2); border-bottom: 1px solid var(--line);
  overflow-x: auto; scrollbar-width: none;
}
.tabs::-webkit-scrollbar { display: none; }
.tab {
  display: inline-flex; align-items: center; gap: 8px; padding: 0 14px;
  font-family: var(--font-mono); font-size: 12.5px; color: var(--mute);
  white-space: nowrap; cursor: pointer; border: none; background: transparent;
  border-bottom: 2px solid transparent; position: relative; transition: color .15s;
}
.tab:hover { color: var(--soft); }
.tab .tick { color: var(--pass); font-size: 11px; }
.tab.active { color: var(--text); border-bottom-color: var(--cat, var(--accent)); background: color-mix(in srgb, var(--cat, var(--accent)) 8%, transparent); }
.tab.active .tick { color: var(--cat, var(--accent)); }

/* ===== READER LAYOUT ===== */
.wrap { display: flex; gap: 30px; max-width: 1240px; margin: 0 auto; padding: 34px 28px 80px; }
.reader { flex: 1; min-width: 0; }
.sheet { max-width: 760px; }

/* Doc header ("test file header") */
.filehead { margin-bottom: 26px; }
.filehead .path { font-family: var(--font-mono); font-size: 12px; letter-spacing: .02em; color: var(--mute); display: flex; align-items: center; gap: 8px; }
.filehead .path .tick { color: var(--pass); }
.filehead .path b { color: var(--cat, var(--accent)); font-weight: 400; }
.filehead h1 { font-family: var(--font-display); font-weight: 700; font-size: 33px; letter-spacing: -.022em; margin: 12px 0 6px; line-height: 1.08; }
.filehead .sub { color: var(--soft); font-size: 15.5px; font-style: italic; }
.filehead .metaline { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--line-soft); font-family: var(--font-mono); font-size: 11.5px; color: var(--mute); }
.filehead .metaline b { color: var(--soft); font-weight: 400; }

/* ===== HOME / RUN SUMMARY ===== */
.home-head { margin-bottom: 26px; }
.home-head .kicker { font-family: var(--font-mono); font-size: 12px; letter-spacing: .2em; text-transform: uppercase; color: var(--accent); }
.home-head h1 { font-family: var(--font-display); font-weight: 700; font-size: clamp(34px, 6vw, 54px); line-height: 1.02; letter-spacing: -.03em; margin: 14px 0 0; }
.home-head h1 .dim { color: var(--mute); font-weight: 500; }
.home-head .lede { color: var(--soft); font-size: 17px; max-width: 60ch; margin: 16px 0 0; }

/* terminal — the signature live run */
.terminal { margin: 26px 0 22px; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow); }
.terminal .bar { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: color-mix(in srgb, var(--term-bg) 82%, #fff 4%); border-bottom: 1px solid rgba(255,255,255,.06); }
.terminal .bar i { width: 11px; height: 11px; border-radius: 50%; background: #4a4843; }
.terminal .bar i:nth-child(1) { background: #e08a68; } .terminal .bar i:nth-child(2) { background: #d5a35f; } .terminal .bar i:nth-child(3) { background: #9cb67f; }
.terminal .bar span { margin-left: 8px; font-family: var(--font-mono); font-size: 11.5px; color: #8f897b; }
.terminal .screen { background: var(--term-bg); color: #d7d3c8; font-family: var(--font-mono); font-size: 13px; line-height: 1.85; padding: 16px 18px; min-height: 232px; max-height: 300px; overflow-y: auto; }
.terminal .screen .ln { white-space: pre-wrap; word-break: break-word; }
.terminal .screen .ok { color: #9cb67f; } .terminal .screen .cmd { color: #ecab8c; } .terminal .screen .dim { color: #6f6a5f; } .terminal .screen .sum { color: #8bb2dc; }
.terminal .screen .cursor { display: inline-block; width: 8px; height: 15px; vertical-align: -2px; background: #9cb67f; animation: blink 1s steps(2) infinite; }
@keyframes blink { 50% { opacity: 0; } }

.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 34px; }
.stat { border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; background: var(--panel); position: relative; }
.stat::before { content: ''; position: absolute; left: 0; top: 12px; bottom: 12px; width: 3px; border-radius: 2px; background: var(--accent); opacity: .8; }
.stat b { display: block; font-family: var(--font-display); font-size: 24px; font-weight: 700; letter-spacing: -.02em; }
.stat span { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--mute); }
.stat.pass b { color: var(--pass); }
@media (max-width: 680px) { .stats { grid-template-columns: repeat(2, 1fr); } }

.section-label { font-family: var(--font-mono); font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--mute); margin: 0 0 14px; display: flex; align-items: center; gap: 12px; }
.section-label::after { content: ''; flex: 1; height: 1px; background: var(--line); }

/* spec list — runner rows */
.specs { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.spec {
  position: relative; display: block; text-align: left; cursor: pointer;
  background: var(--panel); border: 1px solid var(--line); border-radius: 11px;
  padding: 15px 16px 15px 18px; overflow: hidden;
  transition: transform .16s ease, border-color .16s ease, box-shadow .16s ease;
}
.spec::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--cat); opacity: .7; }
.spec:hover { transform: translateY(-3px); border-color: var(--cat); box-shadow: var(--shadow); }
.spec .row1 { display: flex; align-items: center; gap: 9px; }
.spec .tick { color: var(--pass); font-family: var(--font-mono); font-size: 13px; }
.spec .path { font-family: var(--font-mono); font-size: 12px; color: var(--cat); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.spec .ms { font-family: var(--font-mono); font-size: 10.5px; color: var(--mute); }
.spec h3 { font-family: var(--font-display); font-weight: 600; font-size: 16px; margin: 10px 0 3px; letter-spacing: -.01em; }
.spec p { margin: 0; font-size: 13.5px; color: var(--soft); font-style: italic; line-height: 1.5; }

/* ===== MARKDOWN (warm serif prose) ===== */
.md { font-size: 16px; }
.md h1, .md h2, .md h3, .md h4 { font-family: var(--font-display); font-weight: 600; line-height: 1.3; letter-spacing: -.015em; margin: 1.7em 0 .55em; scroll-margin-top: calc(var(--header-h) + var(--tabs-h) + 16px); }
.md h1 { font-size: 26px; color: var(--accent); padding-bottom: 9px; border-bottom: 1px solid var(--line); }
.md h2 { font-size: 21px; padding-bottom: 6px; border-bottom: 1px solid var(--line-soft); display: flex; align-items: baseline; gap: 9px; }
.md h2::before { content: '§'; color: var(--accent); font-family: var(--font-mono); font-size: 15px; font-weight: 400; }
.md h3 { font-size: 18px; color: var(--accent); }
.md h4 { font-size: 16px; color: var(--soft); }
.md p { margin: .75em 0; }
.md a { color: var(--info); text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 1px; }
.md a:hover { text-decoration-thickness: 2px; }
.md ul, .md ol { padding-left: 1.35em; margin: .7em 0; }
.md li { margin: .32em 0; }
.md li::marker { color: var(--accent); font-family: var(--font-mono); }
.md strong { color: var(--text); font-weight: 600; }
.md em { color: var(--soft); }
.md hr { border: none; border-top: 1px dashed var(--line); margin: 2em 0; }
.md code { font-family: var(--font-mono); font-size: .8em; background: var(--code-bg); color: var(--code-text); padding: 2px 6px; border-radius: 5px; border: 1px solid var(--line-soft); }
.md pre { background: var(--code-bg); border: 1px solid var(--line); border-radius: 10px; padding: 15px 17px; overflow-x: auto; font-size: 13px; line-height: 1.7; position: relative; }
.md pre::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--accent); opacity: .45; border-radius: 10px 0 0 10px; }
.md pre code { background: transparent; border: none; padding: 0; color: inherit; font-size: inherit; }
.md table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 14.5px; display: block; overflow-x: auto; }
.md table thead { background: var(--accent); color: var(--clay-ink); }
.md table th, .md table td { padding: 9px 13px; border: 1px solid var(--line); text-align: left; vertical-align: top; }
.md table th { font-weight: 600; font-family: var(--font-display); }
.md table tbody tr:nth-child(even) { background: var(--stripe); }
.md blockquote { margin: 1.2em 0; padding: 11px 17px; border-left: 3px solid var(--quote); background: var(--quote-bg); color: var(--soft); border-radius: 0 9px 9px 0; font-style: italic; }
.md blockquote strong, .md blockquote em { font-style: normal; }

/* ===== CALLOUTS ===== */
.callout { margin: 1.15em 0; border-radius: 10px; border: 1px solid var(--line); border-left: 3px solid var(--c-color, var(--quote)); background: var(--c-bg, var(--quote-bg)); padding: 13px 17px; }
.callout-h { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; color: var(--c-color); font-weight: 700; font-size: 11.5px; letter-spacing: .06em; text-transform: uppercase; font-family: var(--font-mono); }
.callout-b > :first-child { margin-top: 0; } .callout-b > :last-child { margin-bottom: 0; }
.callout-b p { margin: .4em 0; }
.c-tip { --c-color: var(--tip); --c-bg: var(--tip-bg); }
.c-note { --c-color: var(--note); --c-bg: var(--note-bg); }
.c-warn { --c-color: var(--warn); --c-bg: var(--warn-bg); }
.c-danger { --c-color: var(--danger); --c-bg: var(--danger-bg); }
.c-imp { --c-color: var(--imp); --c-bg: var(--imp-bg); }

/* ===== ANSWER TOGGLES (revision runner) ===== */
.answer-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin: 0 0 22px; padding: 12px 16px; border-radius: 10px; background: var(--accent-soft); border: 1px solid var(--line); }
.answer-bar .hint { color: var(--soft); font-size: 13.5px; font-style: italic; }
.btn-line { font-family: var(--font-mono); font-weight: 700; font-size: 12px; cursor: pointer; border: 1px solid var(--accent); color: var(--accent); background: transparent; padding: 6px 13px; border-radius: 7px; transition: background .15s, color .15s; }
.btn-line:hover { background: var(--accent); color: var(--clay-ink); }
.answer-toggle { display: inline-flex; align-items: center; gap: 7px; margin: 4px 0 6px; }
.answer-toggle::before { content: '▶ run'; font-family: var(--font-mono); font-size: 10px; letter-spacing: .04em; }
.answer-toggle.open::before { content: '▼ output'; }
.answer-wrap { display: none; border-left: 2px solid var(--pass); padding-left: 16px; margin: 8px 0 4px; }
.answer-wrap.open { display: block; animation: ansIn .2s ease; }
@keyframes ansIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

/* ===== MINI-MAP (right rail) ===== */
.toc { width: 218px; flex-shrink: 0; position: sticky; top: calc(var(--header-h) + var(--tabs-h) + 34px); align-self: flex-start; max-height: calc(100vh - var(--header-h) - var(--tabs-h) - 60px); overflow-y: auto; font-size: 13px; }
.toc h4 { font-family: var(--font-mono); font-size: 10px; letter-spacing: .16em; text-transform: uppercase; color: var(--mute); margin: 0 0 10px; }
.toc ul { list-style: none; padding: 0; margin: 0; }
.toc a { display: block; padding: 4px 10px; color: var(--mute); text-decoration: none; border-left: 2px solid var(--line-soft); line-height: 1.35; transition: color .12s, border-color .12s; }
.toc a:hover { color: var(--accent); }
.toc a.lv-3 { padding-left: 20px; font-size: 12px; }
.toc a.active { color: var(--accent); border-left-color: var(--accent); background: var(--accent-soft); font-weight: 600; }
@media (max-width: 1080px) { .toc { display: none; } }

/* ===== COMMAND PALETTE ===== */
.cmdk { position: fixed; inset: 0; z-index: 100; display: none; align-items: flex-start; justify-content: center; padding-top: 12vh; background: rgba(10,9,8,.55); backdrop-filter: blur(4px); }
.cmdk.show { display: flex; animation: fadeIn .15s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.cmdk-box { width: min(620px, 92vw); background: var(--panel); border: 1px solid var(--line); border-radius: 12px; box-shadow: var(--shadow); overflow: hidden; animation: popIn .18s cubic-bezier(.2,.7,.3,1); }
@keyframes popIn { from { transform: translateY(-14px) scale(.98); opacity: 0; } to { transform: none; opacity: 1; } }
.cmdk-in { display: flex; align-items: center; gap: 10px; padding: 15px 17px; border-bottom: 1px solid var(--line); }
.cmdk-in span { color: var(--accent); font-family: var(--font-mono); }
.cmdk-in input { flex: 1; background: transparent; border: none; outline: none; color: var(--text); font-family: var(--font-mono); font-size: 15px; }
.cmdk-in input::placeholder { color: var(--mute); }
.cmdk-list { max-height: 52vh; overflow-y: auto; padding: 8px; }
.cmdk-row { display: flex; align-items: center; gap: 12px; padding: 9px 12px; border-radius: 8px; cursor: pointer; }
.cmdk-row .num { font-family: var(--font-mono); font-size: 11px; color: var(--cat, var(--accent)); border: 1px solid var(--line); border-radius: 5px; padding: 1px 6px; }
.cmdk-row .lbl { flex: 1; min-width: 0; }
.cmdk-row .lbl b { font-family: var(--font-display); font-weight: 600; font-size: 14px; }
.cmdk-row .lbl s { display: block; text-decoration: none; font-size: 11.5px; color: var(--mute); font-family: var(--font-mono); }
.cmdk-row .kind { font-family: var(--font-mono); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: var(--mute); }
.cmdk-row.sel, .cmdk-row:hover { background: var(--accent-soft); }
.cmdk-empty { padding: 22px; text-align: center; color: var(--mute); font-family: var(--font-mono); font-size: 13px; }

::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: var(--line); border-radius: 5px; }
::-webkit-scrollbar-thumb:hover { background: var(--mute); }

:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }

/* ===== ANIMATIONS ===== */
@media (prefers-reduced-motion: no-preference) {
  .filehead, .home-head { animation: rise .45s cubic-bezier(.22,.61,.36,1) both; }
  #mdBody { animation: rise .45s cubic-bezier(.22,.61,.36,1) both; }
  .spec { animation: rise .45s cubic-bezier(.22,.61,.36,1) both; }
  .spec:nth-child(1){animation-delay:.03s}.spec:nth-child(2){animation-delay:.06s}.spec:nth-child(3){animation-delay:.09s}
  .spec:nth-child(4){animation-delay:.12s}.spec:nth-child(5){animation-delay:.15s}.spec:nth-child(6){animation-delay:.18s}
  .spec:nth-child(7){animation-delay:.21s}.spec:nth-child(8){animation-delay:.24s}.spec:nth-child(9){animation-delay:.27s}
  .spec:nth-child(10){animation-delay:.30s}.spec:nth-child(11){animation-delay:.33s}.spec:nth-child(12){animation-delay:.36s}
  html, body, .panel, header, .tabs, .spec, .stat { transition: background-color .3s ease, border-color .3s ease, color .3s ease; }
}
@keyframes rise { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .brand .live::after { animation: none; } }

@media (max-width: 620px) {
  .wrap { padding: 22px 16px 60px; }
  .filehead h1 { font-size: 27px; }
}
</style>
</head>
<body>
<div class="backdrop"></div>
<div class="progress"><i id="progressBar"></i></div>

<header>
  <div class="brand" id="brand" title="Về Index">
    <span class="live" aria-hidden="true"></span>
    <span class="word">QA<b>//</b>SUITE</span>
    <span class="crumb" id="crumb">index</span>
  </div>
  <div class="cmd-hint" id="cmdHint"><span class="txt">Tìm nhanh</span><kbd>⌘</kbd><kbd>K</kbd></div>
  <button class="icon-btn" id="themeBtn" title="Đổi sáng / tối" aria-label="Đổi theme">☀️</button>
</header>

<nav class="tabs" id="tabs" aria-label="Sections"></nav>

<div class="wrap">
  <main class="reader"><div class="sheet" id="sheet"></div></main>
  <aside class="toc" id="toc" style="display:none"><h4>On this file</h4><ul id="tocList"></ul></aside>
</div>

<div class="cmdk" id="cmdk">
  <div class="cmdk-box">
    <div class="cmdk-in"><span>›</span><input id="cmdInput" placeholder="Chạy tới spec hoặc heading…" autocomplete="off"></div>
    <div class="cmdk-list" id="cmdList"></div>
  </div>
</div>

<script id="docs-data" type="application/json">${payload}</script>
<script>
const DOCS = JSON.parse(document.getElementById('docs-data').textContent);
const $ = (id) => document.getElementById(id);
const QA_COUNT = 198;

/* ---- marked + GitHub-alert callouts ---- */
const ALERTS = {
  TIP:{i:'💡',l:'Tip',c:'tip'}, NOTE:{i:'📝',l:'Note',c:'note'}, INFO:{i:'ℹ️',l:'Info',c:'note'},
  WARNING:{i:'⚠️',l:'Warning',c:'warn'}, GOTCHA:{i:'⚠️',l:'Gotcha',c:'warn'}, CAUTION:{i:'🚨',l:'Caution',c:'danger'},
  DANGER:{i:'🚨',l:'Danger',c:'danger'}, IMPORTANT:{i:'⭐',l:'Important',c:'imp'}, KEY:{i:'🔑',l:'Key',c:'imp'}
};
const rnd = new marked.Renderer();
const origBq = rnd.blockquote.bind(rnd);
rnd.blockquote = function(q) {
  const m = q.match(/^\\s*<p>\\s*\\[!(\\w+)\\]\\s*([\\s\\S]*?)<\\/p>([\\s\\S]*)/);
  if (m) { const t = ALERTS[m[1].toUpperCase()]; if (t) {
    const body = (m[2].trim() ? '<p>' + m[2].trim() + '</p>' : '') + m[3];
    return '<div class="callout c-' + t.c + '"><div class="callout-h"><span>' + t.i + '</span><span>' + t.l + '</span></div><div class="callout-b">' + body + '</div></div>';
  }}
  return origBq(q);
};
marked.setOptions({ gfm: true, breaks: false, renderer: rnd, highlight: (code, lang) => {
  if (lang && hljs.getLanguage(lang)) { try { return hljs.highlight(code, { language: lang }).value; } catch (e) {} }
  return hljs.highlightAuto(code).value;
}});

function slug(t) { return t.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/đ/g,'d').replace(/[^\\w\\s\\-]/g,'').trim().replace(/\\s+/g,'-').slice(0,60); }
function pad(n) { return String(n).padStart(2, '0'); }
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- tabs ---- */
function renderTabs() {
  const t = $('tabs'); t.innerHTML = '';
  DOCS.forEach(d => {
    const b = document.createElement('button');
    b.className = 'tab'; b.dataset.id = d.id; b.style.setProperty('--cat', d.accent);
    const label = d.id === 'home' ? 'index' : d.spec;
    b.innerHTML = (d.id === 'home' ? '' : '<span class="tick">✓</span>') + '<span>' + label + '</span>';
    b.addEventListener('click', () => navigate(d.id));
    t.appendChild(b);
  });
}

/* ---- home / run summary ---- */
function renderHome() {
  const p = $('sheet');
  const totalWords = DOCS.reduce((s, d) => s + (d.words || 0), 0);
  const specCount = DOCS.length - 1;
  document.documentElement.style.setProperty('--accent', 'var(--clay)');
  let cards = '';
  DOCS.filter(d => d.id !== 'home').forEach(d => {
    const ms = d.rawHtml ? 'diagram' : (d.words ? d.words.toLocaleString() + 'w' : '');
    cards += '<button class="spec" data-id="' + d.id + '" style="--cat:' + d.accent + '">'
      + '<div class="row1"><span class="tick">✓</span><span class="path">' + d.spec + '</span><span class="ms">' + ms + '</span></div>'
      + '<h3>' + d.title + '</h3><p>' + d.sub + '</p></button>';
  });
  p.innerHTML = '<section class="home-head">'
    + '<div class="kicker">QA Automation · Knowledge Runner</div>'
    + '<h1>Mọi spec đang <span class="dim">passing.</span></h1>'
    + '<p class="lede">Sổ tay kỹ thuật của một QA Automation — Playwright, CI/CD, Kafka, JavaScript, design patterns, thuật toán &amp; SQL cho coding interview, và bộ câu hỏi phỏng vấn. Chạy như một test suite: mở từng spec để đọc, ⌘K để nhảy nhanh.</p>'
    + '</section>'
    + '<div class="terminal"><div class="bar"><i></i><i></i><i></i><span>qa-suite — run --all</span></div><div class="screen" id="termScreen"></div></div>'
    + '<div class="stats">'
    + '<div class="stat"><b>' + specCount + '</b><span>spec files</span></div>'
    + '<div class="stat"><b>' + totalWords.toLocaleString() + '</b><span>words</span></div>'
    + '<div class="stat"><b>' + QA_COUNT + '</b><span>Q&A</span></div>'
    + '<div class="stat pass"><b>PASS</b><span>suite status</span></div>'
    + '</div>'
    + '<div class="section-label">spec files · ' + specCount + '</div>'
    + '<div class="specs">' + cards + '</div>';
  p.querySelectorAll('.spec').forEach(c => c.addEventListener('click', () => navigate(c.dataset.id)));
  $('toc').style.display = 'none';
  runTerminal(totalWords, specCount);
}

/* ---- terminal streaming (the signature moment) ---- */
let termTimers = [];
function clearTerminal() { termTimers.forEach(clearTimeout); termTimers = []; }
function runTerminal(totalWords, specCount) {
  clearTerminal();
  const screen = $('termScreen'); if (!screen) return;
  const specs = DOCS.filter(d => d.id !== 'home');
  const lines = [];
  lines.push({ t: 'cmd', s: '$ qa-suite run --all' });
  lines.push({ t: 'dim', s: 'Loading ' + specCount + ' spec files…' });
  specs.forEach(d => {
    const ms = d.rawHtml ? 'diagram' : (d.words ? d.words.toLocaleString() + 'w' : '0w');
    lines.push({ t: 'ok', s: '  ✓ ' + d.spec.padEnd(20, ' ') + '  ' + ms });
  });
  lines.push({ t: 'sum', s: '' });
  lines.push({ t: 'sum', s: '✓ ' + specCount + ' passed · 0 failed · ' + totalWords.toLocaleString() + ' words indexed' });
  lines.push({ t: 'dim', s: 'Ready. Chọn một spec ở dưới, hoặc ⌘K.' });

  const paint = (upto, withCursor) => {
    screen.innerHTML = lines.slice(0, upto).map(l =>
      '<div class="ln ' + l.t + '">' + (l.s === '' ? '&nbsp;' : escapeHtml(l.s)) + '</div>'
    ).join('') + (withCursor ? '<span class="cursor"></span>' : '');
    screen.scrollTop = screen.scrollHeight;
  };
  if (reduceMotion) { paint(lines.length, false); return; }
  let i = 0;
  const step = () => {
    i++; paint(i, i < lines.length);
    if (i < lines.length) termTimers.push(setTimeout(step, i <= 2 ? 260 : 90));
  };
  step();
}
function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ---- doc ---- */
function renderDoc(d) {
  clearTerminal();
  const p = $('sheet');
  const ms = d.rawHtml ? 'interactive diagram' : (d.words ? d.words.toLocaleString() + ' words' : '');
  p.innerHTML = '<div class="filehead" style="--cat:' + d.accent + '">'
    + '<div class="path"><span class="tick">✓</span> <b>' + d.spec + '</b> · N°' + pad(d.idx) + '</div>'
    + '<h1>' + d.title + '</h1><div class="sub">' + d.sub + '</div>'
    + '<div class="metaline"><span><b>status</b> passing</span><span><b>size</b> ' + ms + '</span><span><b>index</b> ' + pad(d.idx) + ' / ' + pad(DOCS.length - 1) + '</span></div>'
    + '</div><div class="md" id="mdBody"></div>';
  if (d.rawHtml) { $('mdBody').innerHTML = d.content || ''; $('toc').style.display = 'none'; window.scrollTo(0, 0); return; }
  $('mdBody').innerHTML = marked.parse(d.content || '*(empty)*');
  if (d.id === 'interview-answers') setupAnswers();
  buildTOC();
  document.querySelectorAll('#mdBody pre code').forEach(el => { try { hljs.highlightElement(el); } catch (e) {} });
  window.scrollTo(0, 0);
}

/* ---- collapsible answers (revision runner) ---- */
function setupAnswers() {
  const body = $('mdBody'); const wraps = [];
  Array.from(body.children).forEach(node => {
    if (node.tagName !== 'H3' || !/^\\s*\\d+\\./.test(node.textContent)) return;
    const ans = []; let sib = node.nextElementSibling;
    while (sib && sib.tagName !== 'H3' && sib.tagName !== 'H2') { ans.push(sib); sib = sib.nextElementSibling; }
    if (!ans.length) return;
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn-line answer-toggle';
    const wrap = document.createElement('div'); wrap.className = 'answer-wrap';
    node.insertAdjacentElement('afterend', btn); btn.insertAdjacentElement('afterend', wrap);
    ans.forEach(n => wrap.appendChild(n));
    btn.addEventListener('click', () => { const o = wrap.classList.toggle('open'); btn.classList.toggle('open', o); });
    wraps.push({ btn, wrap });
  });
  if (!wraps.length) return;
  const bar = document.createElement('div'); bar.className = 'answer-bar';
  const all = document.createElement('button'); all.type = 'button'; all.className = 'btn-line'; all.textContent = 'Run all';
  const hint = document.createElement('span'); hint.className = 'hint'; hint.textContent = wraps.length + ' câu — đáp án ẩn (▶ run để hiện) để ôn tập.';
  bar.appendChild(all); bar.appendChild(hint); body.insertBefore(bar, body.firstChild);
  all.addEventListener('click', () => {
    const show = !wraps.every(w => w.wrap.classList.contains('open'));
    wraps.forEach(({ btn, wrap }) => { wrap.classList.toggle('open', show); btn.classList.toggle('open', show); });
    all.textContent = show ? 'Hide all' : 'Run all';
  });
}

/* ---- mini-map + scrollspy ---- */
let spy = null;
function buildTOC() {
  const hs = document.querySelectorAll('#mdBody h2, #mdBody h3');
  const list = $('tocList'); list.innerHTML = '';
  if (hs.length < 2) { $('toc').style.display = 'none'; return; }
  $('toc').style.display = '';
  hs.forEach((h, i) => {
    const id = 'h-' + i + '-' + slug(h.textContent); h.id = id;
    const li = document.createElement('li'); const a = document.createElement('a');
    a.href = '#' + id; a.textContent = h.textContent; a.className = 'lv-' + h.tagName.charAt(1);
    a.addEventListener('click', (e) => { e.preventDefault(); document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    li.appendChild(a); list.appendChild(li);
  });
  if (spy) spy.disconnect();
  const links = Array.from(list.querySelectorAll('a'));
  spy = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id)); }), { rootMargin: '-20% 0px -70% 0px' });
  hs.forEach(h => spy.observe(h));
}

/* ---- routing ---- */
function setActive(id) {
  document.querySelectorAll('.tab').forEach(el => el.classList.toggle('active', el.dataset.id === id));
  const d = DOCS.find(x => x.id === id);
  if (d) {
    document.documentElement.style.setProperty('--accent', d.accent);
    document.documentElement.style.setProperty('--accent-soft', hexA(d.accent, .14));
    $('crumb').textContent = d.id === 'home' ? 'index' : d.spec;
    const at = document.querySelector('.tab.active');
    if (at) at.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }
}
function hexA(h, a) { const x = h.replace('#',''); return 'rgba(' + parseInt(x.slice(0,2),16) + ',' + parseInt(x.slice(2,4),16) + ',' + parseInt(x.slice(4,6),16) + ',' + a + ')'; }
function navigate(id) {
  const d = DOCS.find(x => x.id === id) || DOCS[0];
  history.replaceState(null, '', '#' + d.id); setActive(d.id);
  if (d.id === 'home') renderHome(); else renderDoc(d);
  updateProgress();
}
$('brand').addEventListener('click', () => navigate('home'));

/* ---- reading progress ---- */
function updateProgress() {
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  const pct = max > 0 ? Math.min(100, (h.scrollTop || document.body.scrollTop) / max * 100) : 0;
  $('progressBar').style.width = pct + '%';
}
window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress);

/* ---- command palette ---- */
let cmdItems = [], cmdSel = 0;
function buildCmdIndex() {
  const items = DOCS.map(d => ({ kind: 'spec', id: d.id, title: d.title, sub: d.id === 'home' ? 'index' : d.spec, num: d.id === 'home' ? '◆' : pad(d.idx), accent: d.accent }));
  document.querySelectorAll('#mdBody h2, #mdBody h3').forEach(h => items.push({ kind: 'heading', anchor: h.id, title: h.textContent, sub: $('crumb').textContent, num: '#', accent: 'var(--accent)' }));
  return items;
}
function openCmd() { $('cmdk').classList.add('show'); $('cmdInput').value = ''; filterCmd(''); $('cmdInput').focus(); }
function closeCmd() { $('cmdk').classList.remove('show'); }
function filterCmd(q) {
  const all = buildCmdIndex(); const s = q.trim().toLowerCase();
  cmdItems = s ? all.filter(it => (it.title + ' ' + it.sub).toLowerCase().includes(s)) : all;
  cmdSel = 0; renderCmd();
}
function renderCmd() {
  const list = $('cmdList');
  if (!cmdItems.length) { list.innerHTML = '<div class="cmdk-empty">Không có kết quả</div>'; return; }
  list.innerHTML = cmdItems.map((it, i) => '<div class="cmdk-row' + (i === cmdSel ? ' sel' : '') + '" data-i="' + i + '" style="--cat:' + it.accent + '">'
    + '<span class="num">' + it.num + '</span><span class="lbl"><b>' + it.title + '</b><s>' + it.sub + '</s></span><span class="kind">' + it.kind + '</span></div>').join('');
  list.querySelectorAll('.cmdk-row').forEach(r => { r.addEventListener('click', () => runCmd(cmdItems[+r.dataset.i])); r.addEventListener('mousemove', () => { cmdSel = +r.dataset.i; markSel(); }); });
}
function markSel() { $('cmdList').querySelectorAll('.cmdk-row').forEach((r, i) => r.classList.toggle('sel', i === cmdSel)); }
function runCmd(it) {
  closeCmd();
  if (it.kind === 'spec') navigate(it.id);
  else { const el = document.getElementById(it.anchor); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}
$('cmdHint').addEventListener('click', openCmd);
$('cmdInput').addEventListener('input', e => filterCmd(e.target.value));
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('cmdk').classList.contains('show') ? closeCmd() : openCmd(); return; }
  if (!$('cmdk').classList.contains('show')) return;
  if (e.key === 'Escape') closeCmd();
  else if (e.key === 'ArrowDown') { e.preventDefault(); cmdSel = Math.min(cmdSel + 1, cmdItems.length - 1); markSel(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); cmdSel = Math.max(cmdSel - 1, 0); markSel(); }
  else if (e.key === 'Enter' && cmdItems[cmdSel]) { e.preventDefault(); runCmd(cmdItems[cmdSel]); }
});
$('cmdk').addEventListener('click', e => { if (e.target.id === 'cmdk') closeCmd(); });

/* ---- theme ---- */
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  $('themeBtn').textContent = t === 'dark' ? '☀️' : '🌙';
  $('hljs-dark').disabled = t !== 'dark'; $('hljs-light').disabled = t === 'dark';
  localStorage.setItem('suite-theme', t);
}
$('themeBtn').addEventListener('click', () => applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

/* ---- init ---- */
(function () {
  applyTheme(localStorage.getItem('suite-theme') || 'dark');
  renderTabs();
  const start = (location.hash || '#home').slice(1);
  navigate(DOCS.find(d => d.id === start) ? start : 'home');
})();
</script>
</body>
</html>`;

fs.writeFileSync('knowledge.html', html);
console.log('✓ knowledge.html (' + (html.length / 1024).toFixed(1) + ' KB) — Suite · test-runner identity · Poppins + Lora + Space Mono · ⌘K');
