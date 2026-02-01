/**
 * Git repository operations using simple-git
 */

import simpleGit, { type SimpleGit } from 'simple-git';
import type { GitRepository } from './types.js';
import { GitError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { parseDiff, detectLanguage } from './diff-parser.js';
import type { DiffInfo } from '../../types/review.js';
import path from 'path';

export class GitRepositoryManager {
  private git: SimpleGit;

  constructor(repoPath: string) {
    const resolvedPath = path.resolve(repoPath);
    this.git = simpleGit(resolvedPath);
    logger.debug({ repoPath: resolvedPath }, 'Initialized git repository manager');
  }

  /**
   * Get repository information
   */
  async getRepositoryInfo(): Promise<GitRepository> {
    try {
      const [currentBranch, branches] = await Promise.all([
        this.git.revparse(['--abbrev-ref', 'HEAD']),
        this.git.branchLocal(),
      ]);

      return {
        path: this.git.cwd(),
        currentBranch: currentBranch.trim(),
        branches: branches.all,
      };
    } catch (error) {
      throw new GitError(
        `Failed to get repository info: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * Check if branch exists
   */
  async branchExists(branch: string): Promise<boolean> {
    try {
      const branches = await this.git.branchLocal();
      return branches.all.includes(branch);
    } catch {
      return false;
    }
  }

  /**
   * Get diff between two branches
   */
  async getDiff(
    sourceBranch: string,
    targetBranch: string,
    maxDiffSize: number = 10485760
  ): Promise<DiffInfo[]> {
    try {
      logger.info({ sourceBranch, targetBranch }, 'Getting diff between branches');

      // Check if branches exist
      const [sourceExists, targetExists] = await Promise.all([
        this.branchExists(sourceBranch),
        this.branchExists(targetBranch),
      ]);

      if (!sourceExists) {
        throw new GitError(`Source branch does not exist: ${sourceBranch}`);
      }
      if (!targetExists) {
        throw new GitError(`Target branch does not exist: ${targetBranch}`);
      }

      // Get diff output
      const diffOutput = await this.git.diff([targetBranch, sourceBranch, '--']);

      if (diffOutput.length > maxDiffSize) {
        throw new GitError(`Diff size (${diffOutput.length}) exceeds maximum (${maxDiffSize})`);
      }

      // Parse diff
      const diffs = parseDiff(diffOutput);

      // Convert to DiffInfo format
      const diffInfos: DiffInfo[] = diffs
        .filter((diff) => !diff.binary && diff.filePath)
        .map((diff) => {
          const filePath = diff.filePath!;
          return {
            filePath,
            language: detectLanguage(filePath),
            additions: diff.additions,
            deletions: diff.deletions,
            diff: diff.diff,
          };
        });

      logger.info({ fileCount: diffInfos.length }, 'Parsed diff successfully');

      return diffInfos;
    } catch (error) {
      if (error instanceof GitError) {
        throw error;
      }
      throw new GitError(
        `Failed to get diff: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * Get diff for current working directory changes
   */
  async getWorkingDiff(maxDiffSize: number = 10485760): Promise<DiffInfo[]> {
    try {
      const diffOutput = await this.git.diff();

      if (diffOutput.length > maxDiffSize) {
        throw new GitError(`Diff size (${diffOutput.length}) exceeds maximum (${maxDiffSize})`);
      }

      const diffs = parseDiff(diffOutput);

      return diffs
        .filter((diff) => !diff.binary && diff.filePath)
        .map((diff) => {
          const filePath = diff.filePath!;
          return {
            filePath,
            language: detectLanguage(filePath),
            additions: diff.additions,
            deletions: diff.deletions,
            diff: diff.diff,
          };
        });
    } catch (error) {
      throw new GitError(
        `Failed to get working diff: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * Get diff between current branch and base branch
   */
  async getBranchDiff(baseBranch: string, maxDiffSize: number = 10485760): Promise<DiffInfo[]> {
    try {
      const currentBranch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
      return this.getDiff(currentBranch.trim(), baseBranch, maxDiffSize);
    } catch (error) {
      throw new GitError(
        `Failed to get branch diff: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }
}
