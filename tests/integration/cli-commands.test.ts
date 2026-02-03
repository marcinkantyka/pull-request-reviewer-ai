/* eslint-disable security/detect-non-literal-fs-filename */
/**
 * CLI integration tests using a mock LLM server.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const CLI_PATH = path.resolve(process.cwd(), 'dist/cli/index.js');

async function runGit(args: string[], cwd: string): Promise<void> {
  await execFileAsync('git', args, { cwd });
}

async function createRepo(): Promise<string> {
  const repoPath = await mkdtemp(path.join(os.tmpdir(), 'pr-review-cli-'));
  await runGit(['init', '-b', 'main'], repoPath);
  await runGit(['config', 'user.email', 'test@example.com'], repoPath);
  await runGit(['config', 'user.name', 'Test'], repoPath);

  await mkdir(path.join(repoPath, 'src'), { recursive: true });
  await writeFile(path.join(repoPath, 'src', 'app.ts'), 'export const value = 1;\n', 'utf-8');
  await writeFile(path.join(repoPath, 'src', 'old.ts'), 'export const old = true;\n', 'utf-8');

  await runGit(['add', '.'], repoPath);
  await runGit(['commit', '-m', 'initial'], repoPath);

  await runGit(['checkout', '-b', 'feature'], repoPath);
  await writeFile(path.join(repoPath, 'src', 'app.ts'), 'export const value = 2;\n', 'utf-8');
  await writeFile(path.join(repoPath, 'src', 'new.ts'), 'export const added = true;\n', 'utf-8');
  await rm(path.join(repoPath, 'src', 'old.ts'));

  await runGit(['add', '.'], repoPath);
  await runGit(['commit', '-m', 'feature changes'], repoPath);

  return repoPath;
}

describe('CLI integration', () => {
  let repoPath: string;

  beforeAll(async () => {
    repoPath = await createRepo();
  });

  afterAll(async () => {
    await rm(repoPath, { recursive: true, force: true });
  });

  it('produces JSON output with change summary for compare', async () => {
    const outputPath = path.join(repoPath, 'review.json');
    const env = {
      ...process.env,
      LLM_PROVIDER: 'mock',
      LLM_ENDPOINT: 'http://localhost',
      LLM_MODEL: 'mock-model',
      LLM_TEMPERATURE: '0',
      LLM_SEED: '42',
      LOG_LEVEL: 'silent',
      NODE_ENV: 'test',
    };

    await execFileAsync(
      'node',
      [CLI_PATH, 'compare', 'feature', 'main', '--format', 'json', '--output', outputPath],
      { cwd: repoPath, env }
    );

    const output = await readFile(outputPath, 'utf-8');
    const result = JSON.parse(output) as {
      changeSummary: {
        totals: { files: number; added: number; deleted: number; modified: number };
      };
      summary: { filesReviewed: number };
    };

    expect(result.changeSummary.totals.files).toBe(3);
    expect(result.changeSummary.totals.added).toBe(1);
    expect(result.changeSummary.totals.deleted).toBe(1);
    expect(result.changeSummary.totals.modified).toBe(1);
    expect(result.summary.filesReviewed).toBe(3);
  });
});
