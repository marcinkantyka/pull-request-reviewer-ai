/* eslint-disable security/detect-non-literal-fs-filename */
/**
 * E2E tests against a real Ollama instance.
 * Skipped unless RUN_E2E=true is set.
 */

import { describe, it, expect } from 'vitest';
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
  const repoPath = await mkdtemp(path.join(os.tmpdir(), 'pr-review-e2e-'));
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

const suite = process.env.RUN_E2E === 'true' ? describe : describe.skip;

suite('Ollama E2E', () => {
  it(
    'runs compare with a real Ollama instance',
    async () => {
      const repoPath = await createRepo();
      const outputPath = path.join(repoPath, 'review.json');

      const env = {
        ...process.env,
        LOG_LEVEL: 'silent',
        NODE_ENV: 'test',
      };

      await execFileAsync(
        'node',
        [CLI_PATH, 'compare', 'feature', 'main', '--format', 'json', '--output', outputPath],
        { cwd: repoPath, env, timeout: 120_000 }
      );

      const output = await readFile(outputPath, 'utf-8');
      const result = JSON.parse(output) as {
        changeSummary: { totals: { files: number } };
      };

      expect(result.changeSummary.totals.files).toBe(1);
      await rm(repoPath, { recursive: true, force: true });
    },
    120_000
  );
});
