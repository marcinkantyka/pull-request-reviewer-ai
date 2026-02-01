/**
 * Git-related types
 */

export interface GitDiff {
  filePath: string;
  additions: number;
  deletions: number;
  diff: string;
  oldPath?: string;
  newPath?: string;
  binary?: boolean;
}

export interface GitRepository {
  path: string;
  currentBranch: string;
  branches: string[];
}
