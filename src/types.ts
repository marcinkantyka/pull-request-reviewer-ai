/**
 * Type definitions for Local PR Reviewer
 */

export interface PRInfo {
  number: number;
  title: string;
  branch: string;
  author: string;
  baseBranch?: string;
  url?: string;
}

export interface ReviewConfig {
  modelName: string;
  ollamaHost: string;
  repoPath: string;
  reviewsPath: string;
  baseBranch: string;
  maxTokens: number;
  temperature: number;
}

export interface ReviewResult {
  codeQuality: string[];
  potentialBugs: string[];
  securityConcerns: string[];
  bestPractices: string[];
  performance: string[];
  positiveAspects: string[];
  rawResponse: string;
}

export interface ChangedFile {
  path: string;
  additions: number;
  deletions: number;
  changes: number;
}

export interface DiffStats {
  filesChanged: number;
  insertions: number;
  deletions: number;
  totalChanges: number;
}

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OllamaResponse {
  message: {
    content: string;
    role: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
}

export interface OllamaListResponse {
  models: OllamaModel[];
}