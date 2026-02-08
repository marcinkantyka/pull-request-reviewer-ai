/* eslint-disable security/detect-non-literal-fs-filename */
/**
 * UI server integration tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startServer } from '../../src/server/index.js';
import net from 'node:net';

const canListen = await new Promise<boolean>((resolve) => {
  const tester = net
    .createServer()
    .once('error', () => resolve(false))
    .once('listening', () => {
      tester.close(() => resolve(true));
    })
    .listen(0, '127.0.0.1');
});

const execFileAsync = promisify(execFile);

async function runGit(args: string[], cwd: string): Promise<void> {
  await execFileAsync('git', args, { cwd });
}

async function createRepo(): Promise<string> {
  const repoPath = await mkdtemp(path.join(os.tmpdir(), 'pr-review-ui-'));
  await runGit(['init', '-b', 'main'], repoPath);
  await runGit(['config', 'user.email', 'test@example.com'], repoPath);
  await runGit(['config', 'user.name', 'Test'], repoPath);

  await mkdir(path.join(repoPath, 'src'), { recursive: true });
  await writeFile(path.join(repoPath, 'src', 'app.ts'), 'export const value = 1;\n', 'utf-8');
  await runGit(['add', '.'], repoPath);
  await runGit(['commit', '-m', 'initial'], repoPath);

  await runGit(['checkout', '-b', 'feature'], repoPath);
  await writeFile(path.join(repoPath, 'src', 'app.ts'), 'export const value = 2;\n', 'utf-8');
  await runGit(['add', '.'], repoPath);
  await runGit(['commit', '-m', 'feature changes'], repoPath);

  return repoPath;
}

const suite = canListen ? describe : describe.skip;

suite('UI server', () => {
  let repoPath: string;
  let server: { host: string; port: number; close: () => Promise<void> };
  const originalEnv = { ...process.env };

  beforeAll(async () => {
    process.env.LLM_PROVIDER = 'mock';
    process.env.LLM_ENDPOINT = 'http://localhost';
    process.env.LLM_MODEL = 'mock-model';
    process.env.LLM_TEMPERATURE = '0';
    process.env.LLM_SEED = '42';
    process.env.REVIEW_PROJECT_CONTEXT = 'Project context for tests';
    process.env.LOG_LEVEL = 'silent';
    process.env.NODE_ENV = 'test';

    repoPath = await createRepo();
    server = await startServer({ host: '127.0.0.1', port: 0, version: 'test' });
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
    await rm(repoPath, { recursive: true, force: true });
    process.env = { ...originalEnv };
  });

  it('serves defaults and cwd', async () => {
    const res = await fetch(`http://${server.host}:${server.port}/api/defaults`);
    const data = (await res.json()) as {
      ok: boolean;
      defaults?: { review: { projectContext?: string } };
      meta?: { cwd?: string };
    };
    expect(data.ok).toBe(true);
    expect(data.defaults).toBeTruthy();
    expect(data.meta).toBeTruthy();
    if (!data.defaults || !data.meta) {
      throw new Error('Missing defaults or meta in response');
    }
    expect(data.meta.cwd).toBeTruthy();
    expect(data.defaults.review.projectContext).toBe('Project context for tests');
  });

  it('serves config template with project context', async () => {
    const res = await fetch(`http://${server.host}:${server.port}/api/config-template`);
    const data = (await res.json()) as { ok: boolean; template?: string };
    expect(data.ok).toBe(true);
    expect(String(data.template)).toContain('projectContext');
    expect(String(data.template)).toContain('Project context for tests');
  });

  it('lists directories', async () => {
    const res = await fetch(
      `http://${server.host}:${server.port}/api/fs?path=${encodeURIComponent(repoPath)}`
    );
    const data = (await res.json()) as {
      ok: boolean;
      path: string;
      entries: Array<{ name: string }>;
    };
    expect(data.ok).toBe(true);
    expect(data.path).toBe(repoPath);
    expect(data.entries.some((entry: { name: string }) => entry.name === 'src')).toBe(true);
  });

  it('returns unsupported for models when provider is not ollama', async () => {
    const res = await fetch(`http://${server.host}:${server.port}/api/models`);
    const data = (await res.json()) as { ok: boolean; supported: boolean };
    expect(data.ok).toBe(true);
    expect(data.supported).toBe(false);
  });

  it('runs review via API', async () => {
    const payload = {
      mode: 'base',
      repoPath,
      baseBranch: 'main',
      severity: 'all',
    };

    const res = await fetch(`http://${server.host}:${server.port}/api/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as {
      ok: boolean;
      result: { summary: { filesReviewed: number } };
    };
    expect(data.ok).toBe(true);
    expect(data.result.summary.filesReviewed).toBeGreaterThan(0);
  });
});
