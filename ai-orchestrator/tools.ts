/**
 * Custom in-process tools exposed to the QA agents via an SDK MCP server.
 *
 * Keeping the toolset small and explicit is the whole point: the agents can ONLY
 * read files, write files (inside the repo), and run Playwright. No raw shell,
 * no network. The blast radius of the orchestrator is exactly these handlers.
 */
import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { REPO_ROOT } from './paths.ts';

export { REPO_ROOT };

/** Reject path traversal / escapes outside the repo and into sensitive dirs. */
function safeResolve(p: string): string {
  const abs = resolve(REPO_ROOT, p);
  const rel = relative(REPO_ROOT, abs);
  if (rel === '' || rel.startsWith('..')) {
    throw new Error(`Path escapes repo root: ${p}`);
  }
  if (rel.startsWith('node_modules') || rel.startsWith('.git')) {
    throw new Error(`Path is off-limits: ${p}`);
  }
  return abs;
}

const ok = (text: string) => ({ content: [{ type: 'text' as const, text }] });

export const qaServer = createSdkMcpServer({
  name: 'qa',
  version: '0.1.0',
  tools: [
    tool(
      'read_file',
      'Read a UTF-8 text file inside the repo. Use this to inspect page objects, fixtures, config and prior pipeline artifacts before producing your output.',
      { path: z.string().describe('Path relative to repo root, e.g. "src/pages/item.list.page.ts"') },
      async ({ path }) => {
        const abs = safeResolve(path);
        return ok(readFileSync(abs, 'utf8'));
      },
    ),

    tool(
      'list_dir',
      'List the entries of a directory inside the repo (one per line, dirs suffixed with "/").',
      { path: z.string().describe('Directory path relative to repo root, e.g. "src/pages"') },
      async ({ path }) => {
        const abs = safeResolve(path);
        const entries = readdirSync(abs).map((name) => {
          const isDir = statSync(join(abs, name)).isDirectory();
          return isDir ? `${name}/` : name;
        });
        return ok(entries.join('\n') || '(empty)');
      },
    ),

    tool(
      'write_file',
      'Create or overwrite a UTF-8 text file inside the repo (parent dirs are created). Use for pipeline artifacts and for generated/updated test specs and page objects.',
      {
        path: z.string().describe('Path relative to repo root'),
        content: z.string().describe('Full file content to write'),
      },
      async ({ path, content }) => {
        const abs = safeResolve(path);
        mkdirSync(dirname(abs), { recursive: true });
        writeFileSync(abs, content, 'utf8');
        return ok(`Wrote ${content.length} bytes to ${path}`);
      },
    ),

    tool(
      'run_playwright',
      'Run a Playwright spec. When `outPath` is given, the FULL JSON reporter output is written there directly (it can be 100KB+ — never echoed back through the model) and you get only a short pass/fail summary; read outPath later if you need detail. Without `outPath`, the raw JSON is returned inline (legacy). Non-zero exit (failing tests) is captured, not thrown.',
      {
        specPath: z.string().describe('Spec path relative to repo root, e.g. "tests/e2e/ai-generated/foo.spec.ts"'),
        project: z.string().default('chromium').describe('Playwright project name'),
        outPath: z
          .string()
          .optional()
          .describe('If set, write the raw JSON reporter output to this repo-root-relative path instead of returning it, e.g. "ai-orchestrator/artifacts/05-results.json"'),
      },
      async ({ specPath, project, outPath }) => {
        const cmd = `npx playwright test "${specPath}" --project=${project} --reporter=json`;
        let json: string;
        try {
          json = execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
        } catch (e: any) {
          // Playwright exits non-zero on failures; JSON still lands on stdout.
          json = (e?.stdout as string) || (e?.stderr as string) || e?.message || 'unknown error';
        }
        // Legacy path: no outPath → return the raw JSON inline.
        if (!outPath) return ok(json);
        // Preferred path: write the (possibly huge) JSON to disk ourselves, return a tiny summary.
        const abs = safeResolve(outPath);
        mkdirSync(dirname(abs), { recursive: true });
        writeFileSync(abs, json, 'utf8');
        let summary: string;
        try {
          const s = (JSON.parse(json).stats ?? {}) as Record<string, number>;
          summary = `expected=${s.expected ?? '?'} unexpected=${s.unexpected ?? '?'} flaky=${s.flaky ?? '?'} skipped=${s.skipped ?? '?'}`;
        } catch {
          summary = '(could not parse stats — open the file to inspect)';
        }
        return ok(`Wrote ${json.length} bytes of JSON reporter output to ${outPath}. Summary: ${summary}`);
      },
    ),
  ],
});

/** Fully-qualified tool names the agents are allowed to use. */
export const QA_TOOL_NAMES = [
  'mcp__qa__read_file',
  'mcp__qa__list_dir',
  'mcp__qa__write_file',
  'mcp__qa__run_playwright',
];
