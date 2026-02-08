/**
 * Review result types
 */

import type { SeverityLevel, ReviewCategory } from './config.js';

export interface ReviewResult {
  summary: ReviewSummary;
  changeSummary: ChangeSummary;
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
  warnings?: ReviewWarning[];
}

export interface ReviewWarning {
  code: string;
  message: string;
  details?: unknown;
  filePath?: string;
  groupType?: string;
}

export type ChangeType = 'added' | 'deleted' | 'modified' | 'renamed';

export interface ChangeSummary {
  totals: ChangeSummaryTotals;
  topFiles: ChangeSummaryFile[];
  topDirectories: ChangeSummaryDirectory[];
  narrative: string;
}

export interface ChangeSummaryTotals {
  files: number;
  added: number;
  deleted: number;
  modified: number;
  renamed: number;
  additions: number;
  deletions: number;
  net: number;
}

export interface ChangeSummaryFile {
  path: string;
  changeType: ChangeType;
  additions: number;
  deletions: number;
  totalChanges: number;
}

export interface ChangeSummaryDirectory {
  path: string;
  files: number;
  additions: number;
  deletions: number;
  totalChanges: number;
}

export type ChangeSummaryStats = Omit<ChangeSummary, 'narrative'>;

export interface DiffInfo {
  filePath: string;
  language: string;
  additions: number;
  deletions: number;
  diff: string;
  changeType?: ChangeType;
  oldPath?: string;
  newPath?: string;
  oldContent?: string;
  newContent?: string;
}
