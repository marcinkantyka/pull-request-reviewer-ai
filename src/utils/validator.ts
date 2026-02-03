/**
 * Input validation using Zod schemas
 */

import { z } from 'zod';
import path from 'path';
import { ValidationError } from './errors.js';

export const LLMConfigSchema = z.object({
  endpoint: z.string().url(),
  provider: z.enum(['ollama', 'vllm', 'llamacpp', 'openai-compatible']),
  model: z.string().min(1),
  temperature: z.number().min(0).max(2),
  timeout: z.number().positive(),
  maxTokens: z.number().positive().optional(),
  apiKey: z.string().optional(),
  streaming: z.boolean().optional(),
  retries: z.number().min(0).max(10).optional(),
  retryDelay: z.number().positive().optional(),
});

export const NetworkConfigSchema = z.object({
  allowedHosts: z.array(z.string()).min(1),
  strictMode: z.boolean().default(true),
  dnsBlockList: z.array(z.string()).optional(),
});

export const ReviewConfigSchema = z.object({
  maxFiles: z.number().positive(),
  maxLinesPerFile: z.number().positive(),
  excludePatterns: z.array(z.string()),
  severityLevels: z.array(z.enum(['critical', 'high', 'medium', 'low', 'info'])),
  categories: z.array(
    z.enum(['security', 'bugs', 'performance', 'maintainability', 'style', 'bestPractices'])
  ),
  contextAware: z.boolean().optional(),
  groupByDirectory: z.boolean().optional(),
  groupByFeature: z.boolean().optional(),
  maxGroupSize: z.number().positive().max(10).optional(),
  directoryDepth: z.number().int().min(1).max(5).optional(),
  concurrency: z.number().positive().max(10).optional(),
});

export const OutputConfigSchema = z.object({
  defaultFormat: z.enum(['text', 'json', 'md']),
  colorize: z.boolean(),
  showDiff: z.boolean(),
  groupByFile: z.boolean(),
});

export const GitConfigSchema = z.object({
  diffContext: z.number().min(0).max(10),
  maxDiffSize: z.number().positive(),
});

export const ConfigSchema = z.object({
  llm: LLMConfigSchema,
  network: NetworkConfigSchema,
  review: ReviewConfigSchema,
  output: OutputConfigSchema,
  git: GitConfigSchema,
});

import type { AppConfig } from '../types/config.js';

/**
 * Validates configuration object
 */
export function validateConfig(config: unknown): AppConfig {
  try {
    return ConfigSchema.parse(config) as AppConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        `Configuration validation failed: ${error.errors.map((e) => e.message).join(', ')}`,
        error.errors
      );
    }
    throw error;
  }
}

/**
 * Validates file path to prevent path traversal attacks
 */

export function validateFilePath(filePath: string, basePath: string): string {
  const resolved = path.resolve(basePath, filePath);
  const base = path.resolve(basePath);

  if (!resolved.startsWith(base)) {
    throw new ValidationError(`Path traversal detected: ${filePath} resolves outside base path`);
  }

  return resolved;
}

/**
 * Validates branch name
 */
export function validateBranchName(branch: string): void {
  if (!/^[a-zA-Z0-9._/-]+$/.test(branch)) {
    throw new ValidationError(`Invalid branch name: ${branch}`);
  }
}
