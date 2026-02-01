/**
 * Main review engine orchestrating the review process
 */

import type { DiffInfo, ReviewResult, FileReview } from '../../types/review.js';
import type { AppConfig } from '../../types/config.js';
import { ReviewAnalyzer } from './analyzer.js';
import { generateSummary } from './scorer.js';
import { LLMClient } from '../llm/client.js';
import { createLLMProvider } from '../llm/providers.js';
import { logger } from '../../utils/logger.js';
import { minimatch } from 'minimatch';
import { LLMError } from '../../utils/errors.js';

export class ReviewEngine {
  private llmClient: LLMClient;
  private analyzer: ReviewAnalyzer;

  constructor(private readonly config: AppConfig) {
    const provider = createLLMProvider(config.llm);
    this.llmClient = new LLMClient(
      provider,
      config.llm.timeout,
      config.llm.retries || 3,
      config.llm.retryDelay || 1000
    );
    this.analyzer = new ReviewAnalyzer(
      this.llmClient,
      config.llm.model,
      config.llm.temperature
    );
  }

  /**
   * Review code changes
   */
  async review(
    diffs: DiffInfo[],
    sourceBranch: string,
    targetBranch: string
  ): Promise<ReviewResult> {
    const startTime = Date.now();
    logger.info(
      { fileCount: diffs.length, sourceBranch, targetBranch },
      'Starting code review'
    );

    // Filter files based on exclude patterns
    const filteredDiffs = this.filterFiles(diffs);

    // Limit number of files
    const limitedDiffs = filteredDiffs.slice(0, this.config.review.maxFiles);

    logger.info(
      { fileCount: limitedDiffs.length },
      'Files to review after filtering'
    );

    // Review files (with concurrency limit)
    const fileReviews = await this.reviewFiles(limitedDiffs);

    // Generate summary
    const allIssues = fileReviews.flatMap((fr) => fr.issues);
    const summary = generateSummary(fileReviews.length, allIssues);

    const duration = Date.now() - startTime;

    const result: ReviewResult = {
      summary,
      files: fileReviews,
      metadata: {
        timestamp: new Date().toISOString(),
        sourceBranch,
        targetBranch,
        llmModel: this.config.llm.model,
        duration,
      },
    };

    logger.info(
      {
        filesReviewed: summary.filesReviewed,
        totalIssues: summary.totalIssues,
        score: summary.score,
        duration,
      },
      'Code review completed'
    );

    return result;
  }

  /**
   * Filter files based on exclude patterns
   */
  private filterFiles(diffs: DiffInfo[]): DiffInfo[] {
    return diffs.filter((diff) => {
      // Check exclude patterns
      for (const pattern of this.config.review.excludePatterns) {
        if (minimatch(diff.filePath, pattern)) {
          logger.debug({ filePath: diff.filePath, pattern }, 'File excluded');
          return false;
      }
      }

      // Check max lines per file
      const totalLines = diff.additions + diff.deletions;
      if (totalLines > this.config.review.maxLinesPerFile) {
        logger.debug(
          { filePath: diff.filePath, lines: totalLines },
          'File excluded (too many lines)'
        );
        return false;
      }

      return true;
    });
  }

  /**
   * Review multiple files with concurrency control
   */
  private async reviewFiles(diffs: DiffInfo[]): Promise<FileReview[]> {
    const concurrency = 3; // Review 3 files at a time
    const results: FileReview[] = [];

    for (let i = 0; i < diffs.length; i += concurrency) {
      const batch = diffs.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map((diff) => this.reviewSingleFile(diff))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          logger.error(
            { error: result.reason },
            'Failed to review file'
          );
          // Create empty review for failed file
          const diff = batch[batchResults.indexOf(result)];
          results.push({
            path: diff.filePath,
            language: diff.language,
            additions: diff.additions,
            deletions: diff.deletions,
            issues: [],
          });
        }
      }
    }

    return results;
  }

  /**
   * Review a single file
   */
  private async reviewSingleFile(diff: DiffInfo): Promise<FileReview> {
    try {
      const issues = await this.analyzer.analyzeFile(diff);

      return {
        path: diff.filePath,
        language: diff.language,
        additions: diff.additions,
        deletions: diff.deletions,
        issues,
      };
    } catch (error) {
      logger.error(
        { filePath: diff.filePath, error: error instanceof Error ? error.message : String(error) },
        'Failed to review file'
      );

      // Return file review with no issues on error
      return {
        path: diff.filePath,
        language: diff.language,
        additions: diff.additions,
        deletions: diff.deletions,
        issues: [],
      };
    }
  }

  /**
   * Health check for LLM provider
   */
  async healthCheck(): Promise<boolean> {
    return this.llmClient.healthCheck();
  }
}
