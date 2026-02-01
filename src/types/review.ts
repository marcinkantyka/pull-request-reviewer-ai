/**
 * Review result types
 */

import type { SeverityLevel, ReviewCategory } from './config.js';

export interface ReviewResult {
  summary: ReviewSummary;
  files: FileReview[];
  metadata: ReviewMetadata;
}

export interface ReviewSummary {
  filesReviewed: number;
  totalIssues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  score: number; // 0-10
}

export interface FileReview {
  path: string;
  language: string;
  additions: number;
  deletions: number;
  issues: Issue[];
}

export interface Issue {
  line: number;
  severity: SeverityLevel;
  category: ReviewCategory;
  message: string;
  suggestion?: string;
  code?: string; // The problematic code snippet
}

export interface ReviewMetadata {
  timestamp: string;
  sourceBranch: string;
  targetBranch: string;
  llmModel: string;
  duration: number; // milliseconds
}

export interface DiffInfo {
  filePath: string;
  language: string;
  additions: number;
  deletions: number;
  diff: string;
  oldContent?: string;
  newContent?: string;
}
