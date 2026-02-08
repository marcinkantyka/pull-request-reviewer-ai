/**
 * Config loading tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { loadConfig, DEFAULT_CONFIG } from '../../../../src/core/storage/config.js';

const ENV_KEYS = [
  'LLM_ENDPOINT',
  'LLM_PROVIDER',
  'LLM_MODEL',
  'LLM_TEMPERATURE',
  'LLM_TIMEOUT',
  'LLM_SEED',
  'LLM_API_KEY',
  'NETWORK_ALLOWED_HOSTS',
  'CONTEXT_AWARE',
  'GROUP_BY_DIRECTORY',
  'GROUP_BY_FEATURE',
  'MAX_GROUP_SIZE',
  'DIRECTORY_DEPTH',
  'REVIEW_CONCURRENCY',
  'REVIEW_PROJECT_CONTEXT',
  'UI_HOST',
  'UI_PORT',
];

describe('loadConfig', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    ENV_KEYS.forEach((key) => {
      delete process.env[key];
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('deep merges nested defaults with partial config', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'pr-review-config-'));
    const configPath = path.join(dir, 'pr-review.config.yml');

    await writeFile(configPath, `llm:\n  model: custom-model\nreview:\n  maxFiles: 5\n`, 'utf-8');

    const config = await loadConfig(configPath);

    expect(config.llm.model).toBe('custom-model');
    expect(config.llm.endpoint).toBe(DEFAULT_CONFIG.llm.endpoint);
    expect(config.review.maxFiles).toBe(5);
    expect(config.review.excludePatterns).toEqual(DEFAULT_CONFIG.review.excludePatterns);
    expect(config.output.defaultFormat).toBe(DEFAULT_CONFIG.output.defaultFormat);
    expect(config.network.allowedHosts).toEqual(DEFAULT_CONFIG.network.allowedHosts);

    await rm(dir, { recursive: true, force: true });
  });

  it('applies REVIEW_PROJECT_CONTEXT from env', async () => {
    process.env.REVIEW_PROJECT_CONTEXT = 'Do not flag ALB ports';
    const config = await loadConfig();
    expect(config.review.projectContext).toBe('Do not flag ALB ports');
  });
});
