/**
 * viewer.ts — data-driven renderers for the two Test Suite Viewer "screens" that a
 * structured `test-suite.json` (see design/SCHEMA.md) drives:
 *
 *   • 'testcase' — the test-case DETAIL screen (turn 2 of the design): per-case tabs,
 *                  priority / status / technique, covered ACs, description + precondition,
 *                  and the steps × test-data × expected table.
 *   • 'report'   — the execution REPORT screen (turn 3): pass/fail/flaky/skip summary,
 *                  failed & flaky cases with impacted ACs, failure triage, coverage gaps,
 *                  and recommended next actions.
 *
 * Both are self-contained HTML (IBM Plex, #e9ebef canvas, oklch badge system) — the suite
 * object is embedded as JSON and rendered client-side by inline vanilla JS ported from the
 * design's component logic (no support.js, no framework, no npm dependency). The analysis
 * screen (source→AC traceability) is a separate hand-authored format kept in html.ts's callers.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { REPO_ROOT } from './paths.ts';

export type Screen = 'testcase' | 'report';

/** Build a self-contained screen page from a suite object. */
export function renderSuiteScreen(title: string, suite: unknown, screen: Screen): string {
  const payload = JSON.stringify({ suite, screen }).replace(/<\/script>/gi, '<\\/script>');
  return PAGE(title, payload);
}

/**
 * Render `test-suite.json` (or a passed object) to a screen HTML file.
 * Returns the repo-root-relative html path written.
 */
export function renderSuiteFile(suitePathRel: string, outRel: string, screen: Screen, title: string): string {
  const suite = JSON.parse(readFileSync(resolve(REPO_ROOT, suitePathRel), 'utf8'));
  writeFileSync(resolve(REPO_ROOT, outRel), renderSuiteScreen(title, suite, screen), 'utf8');
  return outRel;
}

/** Merge per-test statuses from a Playwright JSON reporter file into a suite object (by [TC-xx] title tag). */
export function statusesFromPlaywright(resultsPathRel: string): Record<string, string> {
  const map: Record<string, string> = {};
  try {
    const j = JSON.parse(readFileSync(resolve(REPO_ROOT, resultsPathRel), 'utf8'));
    const walk = (suites: any[]) => {
      for (const s of suites || []) {
        for (const spec of s.specs || []) {
          const m = String(spec.title || '').match(/\bTC-?(\d+)\b/i);
          if (!m) continue;
          const id = 'TC-' + String(m[1]).padStart(2, '0');
          const tests = spec.tests || [];
          const results = tests.flatMap((t: any) => t.results || []);
          const statuses = results.map((r: any) => r.status);
          let st = 'not_run';
          if (spec.ok === false || statuses.includes('failed') || statuses.includes('timedOut')) st = 'fail';
          else if (statuses.length && statuses.every((x: string) => x === 'skipped')) st = 'skipped';
          else if (statuses.includes('passed')) st = tests.some((t: any) => (t.results || []).length > 1) ? 'flaky' : 'pass';
          map[id] = st;
        }
        if (s.suites) walk(s.suites);
      }
    };
    walk(j.suites || []);
  } catch { /* leave map empty */ }
  return map;
}

const PAGE = (title: string, payload: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: #e9ebef; color: #33394a;
    font-family: 'IBM Plex Sans', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased; zoom: 1.08;
  }
  @media (max-width: 860px) { body { zoom: 1; } }
  a { color: oklch(0.5 0.13 255); text-decoration: none; }
  .wrap { max-width: 1060px; margin: 0 auto; padding: 34px clamp(14px, 3vw, 40px) 72px; }
  .screen-head { display: flex; align-items: baseline; gap: 10px; margin: 0 0 22px; flex-wrap: wrap; }
  .screen-tid { font: 600 10px 'IBM Plex Mono', monospace; padding: 3px 7px; background: #1a1c22; color: #fff; border-radius: 4px; }
  .screen-tname { font: 600 13px/1.2 'IBM Plex Sans', sans-serif; color: #1a1c22; }
  .card { background: #fff; border: 1px solid #d7dae0; border-radius: 12px; box-shadow: 0 1px 2px rgba(20,24,33,.05), 0 8px 24px -12px rgba(20,24,33,.12); overflow: hidden; }
  .tsv-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
  .tsv-scroll::-webkit-scrollbar-thumb { background: #c7cbd2; border-radius: 4px; }
  .foot { margin: 26px 0 0; font: 12px/1.6 'IBM Plex Sans', sans-serif; color: rgba(0,0,0,.5); max-width: 820px; }
</style>
</head>
<body>
<div class="wrap" id="root"></div>
<script type="application/json" id="data">${payload}</script>
<script>
(function () {
  var DATA = JSON.parse(document.getElementById('data').textContent);
  var SCREEN = DATA.screen;
  var d = DATA.suite || {};
  var suite = d.suite || {};
  var acs = d.acceptanceCriteria || [];
  var cases = d.testCases || [];

  var TECH = {
    BVA: { name: 'Boundary Value Analysis', abbr: 'BVA', hue: 25 },
    EQP: { name: 'Equivalence Partitioning', abbr: 'EQP', hue: 150 },
    DT:  { name: 'Decision Table', abbr: 'DT', hue: 258 },
    UC:  { name: 'Use Case', abbr: 'UC', hue: 300 },
    ST:  { name: 'State Transition', abbr: 'ST', hue: 200 },
    EG:  { name: 'Error Guessing', abbr: 'EG', hue: 65 },
    PW:  { name: 'Pairwise', abbr: 'PW', hue: 335 }
  };
  var PRIORITY = { High: 25, Medium: 65, Low: 150 };
  var STATUS = {
    not_run: { label: 'Not run', hue: null }, pass: { label: 'Pass', hue: 150 },
    fail: { label: 'Fail', hue: 25 }, blocked: { label: 'Blocked', hue: 65 },
    skipped: { label: 'Skipped', hue: null }, flaky: { label: 'Flaky', hue: 300 }
  };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function acById(id) { for (var i=0;i<acs.length;i++) if (acs[i].id===id) return acs[i]; return { num: id, text: '' }; }
  function acNum(id) { return acById(id).num || id; }
  function statusOf(c) { return c.status || 'not_run'; }
  function coveringCases(acId) { return cases.filter(function (c) { return (c.acs||[]).indexOf(acId) >= 0; }); }
  function reportCat(s) { return s==='pass'?'passed':s==='fail'?'failed':s==='flaky'?'flaky':'skipped'; }

  function techBadge(abbr, big) {
    var t = TECH[abbr] || { hue: 240, abbr: abbr }; var h = t.hue;
    return "display:inline-flex;align-items:center;gap:5px;font:600 " + (big?10.5:9.5) + "px/1 'IBM Plex Mono',monospace;letter-spacing:.02em;padding:" + (big?'5px 9px':'4px 7px') + ";border-radius:6px;background:oklch(0.965 0.03 " + h + ");color:oklch(0.46 0.13 " + h + ");border:1px solid oklch(0.87 0.07 " + h + ")";
  }
  function priorityPill(p) { var h = PRIORITY[p] != null ? PRIORITY[p] : 65; return "display:inline-flex;align-items:center;font:600 10.5px/1 'IBM Plex Mono',monospace;padding:5px 9px;border-radius:6px;color:oklch(0.44 0.13 " + h + ");background:oklch(0.955 0.045 " + h + ");border:1px solid oklch(0.84 0.09 " + h + ")"; }
  function statusPill(status) {
    var m = STATUS[status] || STATUS.not_run;
    if (m.hue == null) return "display:inline-flex;font:600 10.5px/1 'IBM Plex Mono',monospace;padding:5px 9px;border-radius:6px;color:#6b7280;background:#f1f2f4;border:1px solid #dcdfe4";
    return "display:inline-flex;font:600 10.5px/1 'IBM Plex Mono',monospace;padding:5px 9px;border-radius:6px;color:oklch(0.44 0.13 " + m.hue + ");background:oklch(0.955 0.045 " + m.hue + ");border:1px solid oklch(0.84 0.09 " + m.hue + ")";
  }
  function acBadgeBlue(num) { return "display:inline-flex;align-items:center;font:600 10px/1 'IBM Plex Mono',monospace;color:#fff;background:oklch(0.5 0.13 255);padding:3px 6px;border-radius:5px"; }

  var root = document.getElementById('root');

  /* =============================== TESTCASE DETAIL =============================== */
  var selected = cases.length ? cases[0].id : null;
  function renderTestcase() {
    var tabs = cases.map(function (c) {
      var on = c.id === selected;
      return '<button data-tc="' + esc(c.id) + '" class="tc-tab" style="cursor:pointer;font:600 11px/1 \\'IBM Plex Mono\\',monospace;padding:8px 11px;border-radius:7px;border:1px solid ' + (on?'oklch(0.55 0.14 255)':'#d7dae0') + ';background:' + (on?'oklch(0.5 0.13 255)':'#fff') + ';color:' + (on?'#fff':'#5b6472') + '">' + esc(c.id) + '</button>';
    }).join('');

    var c = null; for (var i=0;i<cases.length;i++) if (cases[i].id===selected) c = cases[i];
    if (!c) c = cases[0] || {};
    var tech = (c.tech || []).map(function (t) { return '<span title="' + esc((TECH[t]||{}).name||t) + '" style="' + techBadge(t, true) + '">' + esc((TECH[t]||{}).abbr||t) + ' · ' + esc((TECH[t]||{}).name||t) + '</span>'; }).join('');
    var acRows = (c.acs || []).map(function (id) {
      return '<div style="display:flex;align-items:flex-start;gap:10px"><span style="display:inline-flex;align-items:center;font:600 11px/1 \\'IBM Plex Mono\\',monospace;color:#fff;background:oklch(0.5 0.13 255);padding:5px 9px;border-radius:6px">' + esc(acNum(id)) + '</span><span style="font:400 13px/1.5 \\'IBM Plex Sans\\',sans-serif;color:#3d4453;padding-top:2px">' + esc(acById(id).text) + '</span></div>';
    }).join('');
    var steps = (c.steps || []).map(function (s, i) {
      return '<div style="display:grid;grid-template-columns:40px 1.3fr 1fr 1.2fr;border-top:1px solid #f1f3f5">'
        + '<div style="padding:11px 12px;font:500 12px/1.5 \\'IBM Plex Mono\\',monospace;color:#a7aebb">' + (i+1) + '</div>'
        + '<div style="padding:11px 12px;font:400 12.5px/1.5 \\'IBM Plex Sans\\',sans-serif;color:#2d3340;border-left:1px solid #f1f3f5">' + esc(s.action) + '</div>'
        + '<div style="padding:11px 12px;font:400 12px/1.5 \\'IBM Plex Mono\\',monospace;color:#4a515e;border-left:1px solid #f1f3f5">' + esc(s.data || '—') + '</div>'
        + '<div style="padding:11px 12px;font:400 12.5px/1.5 \\'IBM Plex Sans\\',sans-serif;color:#3d4453;border-left:1px solid #f1f3f5">' + esc(s.expected) + '</div></div>';
    }).join('');

    root.innerHTML =
      '<div class="screen-head"><span class="screen-tid">DETAIL</span><span class="screen-tname">' + esc(suite.title || '') + ' — test-case detail</span></div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:12px">' + tabs + '</div>'
      + '<div class="card" style="padding:0">'
      + '<div style="padding:24px 28px 20px;background:linear-gradient(180deg,#fbfcfd,#f4f6f8);border-bottom:1px solid #e4e7ec">'
      +   '<div style="display:flex;align-items:center;gap:11px;flex-wrap:wrap;margin-bottom:12px"><span style="font:600 12px/1 \\'IBM Plex Mono\\',monospace;color:#fff;background:#1a1c22;padding:6px 10px;border-radius:6px">' + esc(c.id) + '</span><span style="font:600 20px/1.25 \\'IBM Plex Sans\\',sans-serif;color:#15171d">' + esc(c.title) + '</span></div>'
      +   '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">'
      +     '<div style="display:flex;align-items:center;gap:7px"><span style="font:600 10px/1 \\'IBM Plex Mono\\',monospace;color:#8a93a2;letter-spacing:.05em">PRIORITY</span><span style="' + priorityPill(c.priority || 'Medium') + '">' + esc(c.priority || 'Medium') + '</span></div>'
      +     '<div style="display:flex;align-items:center;gap:7px"><span style="font:600 10px/1 \\'IBM Plex Mono\\',monospace;color:#8a93a2;letter-spacing:.05em">STATUS</span><span style="' + statusPill(statusOf(c)) + '">' + esc((STATUS[statusOf(c)]||STATUS.not_run).label) + '</span></div>'
      +     '<div style="display:flex;align-items:center;gap:7px"><span style="font:600 10px/1 \\'IBM Plex Mono\\',monospace;color:#8a93a2;letter-spacing:.05em">TECHNIQUE</span><span style="display:flex;gap:6px;flex-wrap:wrap">' + tech + '</span></div>'
      +   '</div></div>'
      + '<div style="padding:22px 28px 8px">'
      +   '<div style="margin-bottom:20px"><div style="font:600 10px/1 \\'IBM Plex Mono\\',monospace;letter-spacing:.06em;color:#a7aebb;margin-bottom:9px">COVERS ACCEPTANCE CRITERIA</div><div style="display:flex;flex-direction:column;gap:8px">' + acRows + '</div></div>'
      +   '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:22px">'
      +     '<div style="border:1px solid #e9ebef;border-radius:9px;padding:14px 16px;background:#fbfcfd"><div style="font:600 10px/1 \\'IBM Plex Mono\\',monospace;letter-spacing:.06em;color:#a7aebb;margin-bottom:8px">DESCRIPTION</div><div style="font:400 13px/1.55 \\'IBM Plex Sans\\',sans-serif;color:#2d3340">' + esc(c.description || c.title) + '</div></div>'
      +     '<div style="border:1px solid #e9ebef;border-radius:9px;padding:14px 16px;background:#fbfcfd"><div style="font:600 10px/1 \\'IBM Plex Mono\\',monospace;letter-spacing:.06em;color:#a7aebb;margin-bottom:8px">PRE-CONDITION</div><div style="font:400 13px/1.55 \\'IBM Plex Sans\\',sans-serif;color:#2d3340">' + esc(c.precondition || '—') + '</div></div>'
      +   '</div>'
      +   '<div style="font:600 10px/1 \\'IBM Plex Mono\\',monospace;letter-spacing:.06em;color:#a7aebb;margin-bottom:9px">TEST STEPS · TEST DATA · EXPECTED RESULT</div>'
      +   '<div style="border:1px solid #e4e7ec;border-radius:10px;overflow:hidden;margin-bottom:26px">'
      +     '<div style="display:grid;grid-template-columns:40px 1.3fr 1fr 1.2fr;background:#f4f6f8;border-bottom:1px solid #e4e7ec">'
      +       '<div style="padding:9px 12px;font:600 10px/1.2 \\'IBM Plex Mono\\',monospace;color:#8a93a2">#</div>'
      +       '<div style="padding:9px 12px;font:600 10px/1.2 \\'IBM Plex Mono\\',monospace;color:#8a93a2;border-left:1px solid #e9ebef">STEP / ACTION</div>'
      +       '<div style="padding:9px 12px;font:600 10px/1.2 \\'IBM Plex Mono\\',monospace;color:#8a93a2;border-left:1px solid #e9ebef">TEST DATA</div>'
      +       '<div style="padding:9px 12px;font:600 10px/1.2 \\'IBM Plex Mono\\',monospace;color:#8a93a2;border-left:1px solid #e9ebef">EXPECTED RESULT</div>'
      +     '</div>' + steps + '</div>'
      + '</div></div>'
      + '<p class="foot">Generated from <b>test-suite.json</b> · test-case detail screen. Edit the JSON to change this view.</p>';

    var btns = root.querySelectorAll('.tc-tab');
    for (var k=0;k<btns.length;k++) btns[k].addEventListener('click', function (e) { selected = e.currentTarget.getAttribute('data-tc'); renderTestcase(); window.scrollTo(0,0); });
  }

  /* =============================== EXECUTION REPORT =============================== */
  function renderReport() {
    var catHues = { passed: 150, failed: 25, skipped: null, flaky: 300 };
    var counts = { passed: 0, failed: 0, skipped: 0, flaky: 0 };
    cases.forEach(function (c) { counts[reportCat(statusOf(c))]++; });
    var total = cases.length || 1;
    var passRate = Math.round((counts.passed / total) * 100);
    var problem = cases.filter(function (c) { return statusOf(c)==='fail' || statusOf(c)==='flaky'; });
    var riskAcs = {}; problem.forEach(function (c) { (c.acs||[]).forEach(function (a) { riskAcs[a]=1; }); });

    var cards = ['passed','failed','flaky','skipped'].map(function (k) {
      var hue = catHues[k], on = hue != null;
      return '<div style="flex:1;border:1px solid ' + (on?'oklch(0.86 0.07 '+hue+')':'#d7dae0') + ';background:' + (on?'oklch(0.975 0.025 '+hue+')':'#f4f6f8') + ';border-radius:11px;padding:16px 18px">'
        + '<div style="font:700 30px/1 \\'IBM Plex Sans\\',sans-serif;color:' + (on?'oklch(0.48 0.14 '+hue+')':'#6b7280') + '">' + counts[k] + '</div>'
        + '<div style="font:600 11px/1 \\'IBM Plex Mono\\',monospace;letter-spacing:.04em;color:' + (on?'oklch(0.46 0.12 '+hue+')':'#8a93a2') + ';margin-top:8px">' + (k.charAt(0).toUpperCase()+k.slice(1)) + '</div></div>';
    }).join('');
    var bar = ['passed','failed','flaky','skipped'].filter(function (k) { return counts[k]; }).map(function (k) {
      var hue = catHues[k];
      return '<div style="width:' + (counts[k]/total*100) + '%;background:' + (hue!=null?'oklch(0.62 0.15 '+hue+')':'#c0c6d0') + '"></div>';
    }).join('');

    var chips = problem.map(function (c) {
      var h = statusOf(c)==='fail'?25:300;
      var a = (c.acs||[]).map(function (id) { return '<span style="' + acBadgeBlue() + '">' + esc(acNum(id)) + '</span>'; }).join('');
      return '<div style="display:flex;align-items:center;gap:9px;border:1px solid #e4e7ec;border-radius:9px;padding:9px 12px;background:#fbfcfd">'
        + '<span style="font:600 11px/1 \\'IBM Plex Mono\\',monospace;color:#20242e">' + esc(c.id) + '</span>'
        + '<span style="font:600 10px/1 \\'IBM Plex Mono\\',monospace;padding:3px 6px;border-radius:5px;color:oklch(0.44 0.13 '+h+');background:oklch(0.955 0.045 '+h+');border:1px solid oklch(0.84 0.09 '+h+')">' + esc(c.title) + '</span>'
        + '<span style="width:1px;height:16px;background:#e4e7ec"></span><span style="display:flex;gap:5px">' + a + '</span></div>';
    }).join('');

    var triage = problem.map(function (c) {
      var failed = statusOf(c)==='fail'; var h = failed?25:300;
      var last = (c.steps && c.steps.length) ? c.steps[c.steps.length-1].expected : '';
      var tech = (c.tech||[]).map(function (t) { return '<span title="' + esc((TECH[t]||{}).name||t) + '" style="' + techBadge(t,false) + '">' + esc((TECH[t]||{}).abbr||t) + '</span>'; }).join('');
      var a = (c.acs||[]).map(function (id) { return '<span style="' + acBadgeBlue() + '">' + esc(acNum(id)) + '</span>'; }).join('');
      var signal = failed ? ('Failing: expected "' + esc(last) + '". ' + esc(c.description||'')) : ('Intermittent — passes and fails across runs. ' + esc(c.description||''));
      var action = failed ? ('Log a defect and triage the failing step; block sign-off on ' + esc((c.acs||[]).join(', ')) + ' until fixed.') : ('Quarantine and stabilise (timing / shared state); do not trust ' + esc((c.acs||[]).join(', ')) + ' while flaky.');
      return '<div style="display:flex;border:1px solid #e4e7ec;border-radius:10px;overflow:hidden;background:#fff">'
        + '<div style="width:4px;flex:none;background:oklch(0.6 0.15 '+h+')"></div><div style="flex:1;padding:14px 16px">'
        + '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:9px"><span style="font:600 11px/1 \\'IBM Plex Mono\\',monospace;color:#5b6472">' + esc(c.id) + '</span><span style="font:600 13.5px/1.3 \\'IBM Plex Sans\\',sans-serif;color:#20242e">' + esc(c.title) + '</span><span style="display:inline-flex;font:600 10.5px/1 \\'IBM Plex Mono\\',monospace;padding:5px 9px;border-radius:6px;color:oklch(0.44 0.13 '+h+');background:oklch(0.955 0.045 '+h+');border:1px solid oklch(0.84 0.09 '+h+')">' + (failed?'Failed':'Flaky') + '</span><span style="margin-left:auto;display:flex;gap:6px;align-items:center">' + tech + '<span style="width:1px;height:14px;background:#e4e7ec"></span>' + a + '</span></div>'
        + '<div style="display:flex;gap:8px;margin-bottom:7px"><span style="font:600 9.5px/1.5 \\'IBM Plex Mono\\',monospace;color:#a7aebb;width:64px;flex:none">SIGNAL</span><span style="font:400 12.5px/1.5 \\'IBM Plex Sans\\',sans-serif;color:#3d4453">' + signal + '</span></div>'
        + '<div style="display:flex;gap:8px"><span style="font:600 9.5px/1.5 \\'IBM Plex Mono\\',monospace;color:#a7aebb;width:64px;flex:none">ACTION</span><span style="font:500 12.5px/1.5 \\'IBM Plex Sans\\',sans-serif;color:#20242e">' + action + '</span></div>'
        + '</div></div>';
    }).join('');

    var health = acs.map(function (ac) {
      var cs = coveringCases(ac.id); var cats = cs.map(function (c) { return reportCat(statusOf(c)); });
      var level, label, hue;
      if (!cs.length) { level='none'; label='No coverage — no test case'; hue=25; }
      else if (cats.indexOf('failed')>=0) { level='risk'; label='At risk — covering test failing'; hue=25; }
      else if (cats.indexOf('flaky')>=0) { level='unstable'; label='Unstable — covering test flaky'; hue=300; }
      else if (cats.every(function (x) { return x==='passed'; })) { level='ok'; label='Verified'; hue=150; }
      else if (cats.indexOf('passed')>=0) { level='partial'; label='Partly verified — some skipped'; hue=65; }
      else { level='unverified'; label='Not verified — all skipped'; hue=65; }
      var chips = cs.map(function (c) { return '<span style="font:500 10.5px/1 \\'IBM Plex Mono\\',monospace;color:#5b6472;background:#eef0f3;padding:3px 7px;border-radius:5px">' + esc(c.id) + ' · ' + esc((STATUS[statusOf(c)]||{}).label||statusOf(c)) + '</span>'; }).join('');
      return { level: level, html: '<div style="display:flex;align-items:flex-start;gap:12px;padding:13px 16px;border-top:1px solid #f1f3f5">'
        + '<span style="font:600 11px/1 \\'IBM Plex Mono\\',monospace;color:#fff;background:oklch(0.5 0.13 255);padding:4px 8px;border-radius:6px;flex:none">' + esc(ac.num||ac.id) + '</span>'
        + '<div style="flex:1"><div style="font:400 12.5px/1.5 \\'IBM Plex Sans\\',sans-serif;color:#2d3340;margin-bottom:7px">' + esc(ac.text) + '</div><div style="display:flex;flex-wrap:wrap;gap:6px">' + chips + '</div></div>'
        + '<span style="display:inline-flex;align-items:center;font:600 10.5px/1 \\'IBM Plex Sans\\',sans-serif;padding:4px 9px;border-radius:20px;color:oklch(0.42 0.13 '+hue+');background:oklch(0.96 0.04 '+hue+');border:1px solid oklch(0.85 0.08 '+hue+')">' + esc(label) + '</span></div>' };
    });
    var gaps = health.filter(function (a) { return a.level !== 'ok'; }).map(function (a) { return a.html; }).join('');

    var actions = [];
    if (counts.failed || counts.flaky) actions.push({ t: 25, x: 'Hold release — ' + counts.failed + ' failing + ' + counts.flaky + ' flaky test(s) put ' + Object.keys(riskAcs).length + ' acceptance criteria at risk.' });
    cases.filter(function (c) { return statusOf(c)==='fail'; }).forEach(function (c) { actions.push({ t: 25, x: 'Fix ' + c.id + ' "' + c.title + '" — unblocks ' + (c.acs||[]).join(', ') + '.' }); });
    cases.filter(function (c) { return statusOf(c)==='flaky'; }).forEach(function (c) { actions.push({ t: 300, x: 'Stabilise flaky ' + c.id + ' "' + c.title + '" (covers ' + (c.acs||[]).join(', ') + ').' }); });
    acs.forEach(function (ac) { var cs = coveringCases(ac.id); if (!cs.length) actions.push({ t: 65, x: 'Add coverage for ' + (ac.num||ac.id) + ' — no test case exists.' });
      else { var sk = cs.filter(function (c) { return reportCat(statusOf(c))==='skipped'; }); var anyPassFail = cs.some(function (c) { var r=reportCat(statusOf(c)); return r==='passed'||r==='failed'||r==='flaky'; }); if (sk.length && !cs.every(function (c){return reportCat(statusOf(c))==='passed';})) actions.push({ t: 65, x: 'Execute ' + sk.map(function (c){return c.id;}).join(', ') + ' to verify ' + (ac.num||ac.id) + '.' }); } });
    var seen = {}; actions = actions.filter(function (a) { if (seen[a.x]) return false; seen[a.x]=1; return true; });
    var actionsHtml = actions.map(function (a) { return '<div style="display:flex;align-items:flex-start;gap:11px;padding:10px 0;border-top:1px solid #f1f3f5"><span style="width:8px;height:8px;border-radius:2px;flex:none;margin-top:5px;background:oklch(0.6 0.15 '+a.t+')"></span><span style="font:400 13px/1.55 \\'IBM Plex Sans\\',sans-serif;color:#2d3340">' + esc(a.x) + '</span></div>'; }).join('');
    var sec = function (t) { return '<div style="font:600 10px/1 \\'IBM Plex Mono\\',monospace;letter-spacing:.06em;color:#a7aebb;margin-bottom:11px">' + t + '</div>'; };

    root.innerHTML =
      '<div class="screen-head"><span class="screen-tid">REPORT</span><span class="screen-tname">' + esc(suite.title || '') + ' — execution report</span></div>'
      + '<div class="card" style="padding:0">'
      + '<div style="padding:24px 28px 22px;background:linear-gradient(180deg,#fbfcfd,#f4f6f8);border-bottom:1px solid #e4e7ec">'
      +   '<div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:18px"><span style="font:600 12px/1 \\'IBM Plex Mono\\',monospace;color:#fff;background:#1a1c22;padding:6px 10px;border-radius:6px">' + esc(suite.id||'') + '</span><span style="font:600 19px/1.2 \\'IBM Plex Sans\\',sans-serif;color:#15171d">' + esc(suite.title||'') + ' — execution report</span><span style="margin-left:auto;display:flex;align-items:baseline;gap:8px"><span style="font:700 26px/1 \\'IBM Plex Sans\\',sans-serif;color:oklch(0.5 0.13 150)">' + passRate + '%</span><span style="font:500 12px/1 \\'IBM Plex Sans\\',sans-serif;color:#5b6472">pass rate · ' + total + ' test cases</span></span></div>'
      +   '<div style="display:flex;gap:12px;margin-bottom:14px">' + cards + '</div>'
      +   '<div style="display:flex;height:9px;border-radius:5px;overflow:hidden;background:#e4e7ec">' + bar + '</div>'
      + '</div><div style="padding:24px 28px 10px">'
      +   (problem.length ? (sec('FAILED &amp; FLAKY TEST CASES — IMPACTED ACCEPTANCE CRITERIA') + '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:26px">' + chips + '</div>') : '')
      +   (problem.length ? (sec('FAILURE TRIAGE') + '<div style="display:flex;flex-direction:column;gap:12px;margin-bottom:28px">' + triage + '</div>') : '')
      +   sec('COVERAGE GAPS vs ACCEPTANCE CRITERIA') + '<div style="border:1px solid #e4e7ec;border-radius:10px;overflow:hidden;margin-bottom:28px">' + (gaps || '<div style="padding:14px 16px;font:400 12.5px/1.5 \\'IBM Plex Sans\\',sans-serif;color:oklch(0.42 0.13 150)">All acceptance criteria are verified — no gaps.</div>') + '</div>'
      +   sec('RECOMMENDED NEXT ACTIONS') + '<div style="border:1px solid #e4e7ec;border-radius:10px;padding:6px 16px;margin-bottom:8px">' + (actionsHtml || '<div style="padding:10px 0;font:400 13px/1.55 \\'IBM Plex Sans\\',sans-serif;color:#2d3340">No blocking actions — suite is green.</div>') + '</div>'
      + '</div></div>'
      + '<p class="foot">Generated from <b>test-suite.json</b> (statuses merged from the Playwright run) · execution report screen.</p>';
  }

  if (SCREEN === 'report') renderReport(); else renderTestcase();
})();
</script>
</body>
</html>
`;
