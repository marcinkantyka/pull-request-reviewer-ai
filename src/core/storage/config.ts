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
    streaming: false,
    retries: 3,
    retryDelay: 1000,
  },
  network: {
    allowedHosts: ['localhost', '127.0.0.1', '::1'],
    strictMode: process.env.NETWORK_STRICT_MODE === 'true',
    dnsBlockList: ['*'],
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
    categories: [
      'security',
      'bugs',
      'performance',
      'maintainability',
      'style',
      'bestPractices',
    ],
    // Context-aware review options
    // Default: true (enabled), can be disabled via CONTEXT_AWARE=false
    contextAware:
      process.env.CONTEXT_AWARE === undefined
        ? true
        : process.env.CONTEXT_AWARE === 'true',
    // Default: true (enabled), can be disabled via GROUP_BY_DIRECTORY=false
    groupByDirectory:
      process.env.GROUP_BY_DIRECTORY === undefined
        ? true
        : process.env.GROUP_BY_DIRECTORY !== 'false',
    // Default: true (enabled), can be disabled via GROUP_BY_FEATURE=false
    groupByFeature:
      process.env.GROUP_BY_FEATURE === undefined
        ? true
        : process.env.GROUP_BY_FEATURE !== 'false',
    // Default: 5, can be overridden via MAX_GROUP_SIZE env var
    maxGroupSize: process.env.MAX_GROUP_SIZE
      ? parseInt(process.env.MAX_GROUP_SIZE, 10)
      : 5,
    // Default: 2, can be overridden via DIRECTORY_DEPTH env var
    directoryDepth: process.env.DIRECTORY_DEPTH
      ? parseInt(process.env.DIRECTORY_DEPTH, 10)
      : 2,
    // Default: 3, can be overridden via REVIEW_CONCURRENCY env var
    concurrency: process.env.REVIEW_CONCURRENCY
      ? parseInt(process.env.REVIEW_CONCURRENCY, 10)
      : 3,
  },
  output: {
    defaultFormat: 'text',
    colorize: true,
    showDiff: false,
    groupByFile: true,
  },
  git: {
    diffContext: 3,
    maxDiffSize: 10485760, // 10MB
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

  // Merge with defaults and environment variables
  const config: Partial<AppConfig> = result?.config
    ? { ...DEFAULT_CONFIG, ...result.config }
    : DEFAULT_CONFIG;

  // Override with environment variables
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

  // Validate configuration
  try {
    return validateConfig(config) as AppConfig;
  } catch (error) {
    throw new ConfigError(
      `Invalid configuration: ${error instanceof Error ? error.message : String(error)}`,
      error
    );
  }
}
