/**
 * Configuration types for PR Review CLI
 * Supports YAML config files with environment variable overrides
 */

export type LLMProvider = 'ollama' | 'vllm' | 'llamacpp' | 'openai-compatible';

export interface LLMConfig {
  endpoint: string;
  provider: LLMProvider;
  model: string;
  temperature: number;
  timeout: number;
  maxTokens?: number;
  apiKey?: string;
  streaming?: boolean;
  retries?: number;
  retryDelay?: number;
}

export interface NetworkConfig {
  allowedHosts: string[];
  strictMode: boolean;
  dnsBlockList?: string[];
}

export interface ReviewConfig {
  maxFiles: number;
  maxLinesPerFile: number;
  excludePatterns: string[];
  severityLevels: SeverityLevel[];
  categories: ReviewCategory[];
  // Context-aware review options
  contextAware?: boolean;
  groupByDirectory?: boolean;
  groupByFeature?: boolean;
  maxGroupSize?: number;
  directoryDepth?: number;
  concurrency?: number;
}

export interface OutputConfig {
  defaultFormat: 'text' | 'json' | 'md';
  colorize: boolean;
  showDiff: boolean;
  groupByFile: boolean;
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
}

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type ReviewCategory =
  | 'security'
  | 'bugs'
  | 'performance'
  | 'maintainability'
  | 'style'
  | 'bestPractices';
