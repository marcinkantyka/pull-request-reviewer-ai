/**
 * Configuration management with cosmiconfig
 */

import { cosmiconfig } from 'cosmiconfig';
import type { AppConfig } from '../../types/config.js';
import { ConfigError } from '../../utils/errors.js';
import { validateConfig } from '../../utils/validator.js';
import { logger } from '../../utils/logger.js';

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: AppConfig = {
  llm: {
    endpoint: process.env.LLM_ENDPOINT || 'http://localhost:11434',
    provider: (process.env.LLM_PROVIDER as AppConfig['llm']['provider']) || 'ollama',
    model: process.env.LLM_MODEL || 'deepseek-coder:6.7b',
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.2'),
    timeout: parseInt(process.env.LLM_TIMEOUT || '60000', 10),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '2048', 10),
    apiKey: process.env.LLM_API_KEY,
    seed: process.env.LLM_SEED ? parseInt(process.env.LLM_SEED, 10) : undefined,
    retries: 3,
    retryDelay: 1000,
  },
  network: {
    allowedHosts: ['localhost', '127.0.0.1', '::1'],
  },
  review: {
    maxFiles: 50,
    maxLinesPerFile: 1000,
    excludePatterns: [
      '*.lock',
      '*.min.js',
      '*.min.css',
      'node_modules/**',
      'dist/**',
      'build/**',
      '.git/**',
      '*.log',
      '*.swp',
    ],
    severityLevels: ['critical', 'high', 'medium', 'low', 'info'],
    categories: ['security', 'bugs', 'performance', 'maintainability', 'style', 'bestPractices'],
    includeAllFiles: false,
    changeSummaryMode: 'deterministic',
    contextAware:
      process.env.CONTEXT_AWARE === undefined ? true : process.env.CONTEXT_AWARE === 'true',
    groupByDirectory:
      process.env.GROUP_BY_DIRECTORY === undefined
        ? true
        : process.env.GROUP_BY_DIRECTORY !== 'false',
    groupByFeature:
      process.env.GROUP_BY_FEATURE === undefined ? true : process.env.GROUP_BY_FEATURE !== 'false',
    maxGroupSize: process.env.MAX_GROUP_SIZE ? parseInt(process.env.MAX_GROUP_SIZE, 10) : 5,
    directoryDepth: process.env.DIRECTORY_DEPTH ? parseInt(process.env.DIRECTORY_DEPTH, 10) : 2,
    concurrency: process.env.REVIEW_CONCURRENCY ? parseInt(process.env.REVIEW_CONCURRENCY, 10) : 3,
  },
  output: {
    defaultFormat: 'text',
    colorize: true,
    showDiff: false,
  },
  git: {
    diffContext: 3,
    maxDiffSize: 10485760, // 10MB
  },
  server: {
    host: process.env.UI_HOST || '127.0.0.1',
    port: process.env.UI_PORT ? parseInt(process.env.UI_PORT, 10) : 0,
  },
};

/**
 * Load configuration from file and environment variables
 */
export async function loadConfig(configPath?: string): Promise<AppConfig> {
  const explorer = cosmiconfig('pr-review', {
    searchPlaces: [
      'package.json',
      'pr-review.config.json',
      'pr-review.config.yaml',
      'pr-review.config.yml',
      'pr-review.config.js',
      'pr-review.config.ts',
      '.pr-reviewrc',
      '.pr-reviewrc.json',
      '.pr-reviewrc.yaml',
      '.pr-reviewrc.yml',
    ],
  });

  let result;
  try {
    if (configPath) {
      result = await explorer.load(configPath);
    } else {
      result = await explorer.search();
    }
  } catch (error) {
    logger.warn(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to load config file, using defaults'
    );
    result = null;
  }

  const config: Partial<AppConfig> = result?.config
    ? {
        ...DEFAULT_CONFIG,
        ...result.config,
        llm: { ...DEFAULT_CONFIG.llm, ...result.config.llm },
        network: { ...DEFAULT_CONFIG.network, ...result.config.network },
        review: { ...DEFAULT_CONFIG.review, ...result.config.review },
        output: { ...DEFAULT_CONFIG.output, ...result.config.output },
        git: { ...DEFAULT_CONFIG.git, ...result.config.git },
        server: { ...DEFAULT_CONFIG.server, ...result.config.server },
      }
    : DEFAULT_CONFIG;

  if (process.env.LLM_ENDPOINT) {
    config.llm!.endpoint = process.env.LLM_ENDPOINT;
  }
  if (process.env.LLM_PROVIDER) {
    config.llm!.provider = process.env.LLM_PROVIDER as AppConfig['llm']['provider'];
  }
  if (process.env.LLM_MODEL) {
    config.llm!.model = process.env.LLM_MODEL;
  }
  if (process.env.LLM_TEMPERATURE) {
    config.llm!.temperature = parseFloat(process.env.LLM_TEMPERATURE);
  }
  if (process.env.LLM_TIMEOUT) {
    config.llm!.timeout = parseInt(process.env.LLM_TIMEOUT, 10);
  }
  if (process.env.LLM_API_KEY) {
    config.llm!.apiKey = process.env.LLM_API_KEY;
  }
  if (process.env.LLM_SEED) {
    config.llm!.seed = parseInt(process.env.LLM_SEED, 10);
  }
  if (process.env.NETWORK_ALLOWED_HOSTS) {
    config.network!.allowedHosts = process.env.NETWORK_ALLOWED_HOSTS.split(',')
      .map((host) => host.trim())
      .filter((host) => host.length > 0);
  }

  try {
    return validateConfig(config) as AppConfig;
  } catch (error) {
    throw new ConfigError(
      `Invalid configuration: ${error instanceof Error ? error.message : String(error)}`,
      error
    );
  }
}
