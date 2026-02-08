/**
 * Configuration types for PR Review CLI
 * Supports YAML config files with environment variable overrides
 */

export type LLMProvider = 'ollama' | 'vllm' | 'llamacpp' | 'openai-compatible' | 'mock';

export interface LLMConfig {
  endpoint: string;
  provider: LLMProvider;
  model: string;
  temperature: number;
  topP?: number;
  timeout: number;
  maxTokens?: number;
  apiKey?: string;
  seed?: number;
  retries?: number;
  retryDelay?: number;
}

export interface NetworkConfig {
  allowedHosts: string[];
}

export interface ReviewConfig {
  maxFiles: number;
  maxLinesPerFile: number;
  excludePatterns: string[];
  severityLevels: SeverityLevel[];
  categories: ReviewCategory[];
  /**
   * Project-specific context to guide review quality and reduce false positives.
   * Example: architecture constraints, domain rules, or known tradeoffs.
   */
  projectContext?: string;
  /**
   * Include all files in review, ignoring exclude patterns and size limits.
   * Default: false
   */
  includeAllFiles?: boolean;
  /**
   * Change summary generation mode.
   * - deterministic: build narrative from stats only (repeatable)
   * - llm: LLM-generated narrative
   * Default: deterministic
   */
  changeSummaryMode?: 'deterministic' | 'llm';
  /**
   * Enable context-aware review that groups related files together.
   * When enabled, files in the same directory or feature are reviewed together
   * to detect cross-file issues like breaking changes and dependency problems.
   * Default: true
   */
  contextAware?: boolean;
  /**
   * Group files that are in the same directory for context-aware review.
   * Files in the same directory (up to directoryDepth levels) are reviewed together.
   * Default: true
   */
  groupByDirectory?: boolean;
  /**
   * Group files by feature/module for context-aware review.
   * Files in features/, modules/, or components/ directories are grouped together.
   * Default: true
   */
  groupByFeature?: boolean;
  /**
   * Maximum number of files to include in a single review group.
   * Larger groups provide more context but use more tokens.
   * Valid range: 1-10
   * Default: 5
   */
  maxGroupSize?: number;
  /**
   * Number of directory levels to consider when grouping files by directory.
   * For example, depth=2 means files in src/api/users/ and src/api/auth/ are grouped.
   * Valid range: 1-5
   * Default: 2
   */
  directoryDepth?: number;
  /**
   * Number of file groups to review in parallel.
   * Higher values speed up reviews but may overwhelm the LLM server.
   * Valid range: 1-10
   * Default: 3
   */
  concurrency?: number;
}

export interface OutputConfig {
  defaultFormat: 'text' | 'json' | 'md';
  colorize: boolean;
  showDiff: boolean;
}

export interface GitConfig {
  diffContext: number;
  maxDiffSize: number;
}

export interface AppConfig {
  llm: LLMConfig;
  network: NetworkConfig;
  review: ReviewConfig;
  output: OutputConfig;
  git: GitConfig;
  server?: {
    host?: string;
    port?: number;
  };
}

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type ReviewCategory =
  | 'security'
  | 'bugs'
  | 'performance'
  | 'maintainability'
  | 'style'
  | 'bestPractices';
