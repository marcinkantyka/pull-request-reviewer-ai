/**
 * Git-related types
 */

import type { ChangeType } from '../../types/review.js';

export interface GitDiff {
  filePath: string;
  additions: number;
  deletions: number;
  diff: string;
  oldPath?: string;
  newPath?: string;
  binary?: boolean;
  changeType?: ChangeType;
}

export interface GitRepository {
  path: string;
  currentBranch: string;
  branches: string[];
}
