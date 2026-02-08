/**
 * Main review engine orchestrating the review process
 */

import type {
  DiffInfo,
  ReviewResult,
  FileReview,
  ChangeSummaryStats,
  ReviewWarning,
} from '../../types/review.js';
import type { AppConfig } from '../../types/config.js';
import { ReviewAnalyzer } from './analyzer.js';
import { generateSummary } from './scorer.js';
import { LLMClient } from '../llm/client.js';
import { createLLMProvider } from '../llm/providers.js';
import { logger } from '../../utils/logger.js';
import { minimatch } from 'minimatch';
import { groupFiles, type FileGroup, type GroupingOptions } from './file-grouper.js';
import { buildChangeSummaryStats, buildDeterministicNarrative } from './change-summary.js';

export class ReviewEngine {
  private llmClient: LLMClient;
  private analyzer: ReviewAnalyzer;
  private warnings: ReviewWarning[] = [];

  constructor(private readonly config: AppConfig) {
    const provider = createLLMProvider(config.llm, config.network.allowedHosts);
    this.llmClient = new LLMClient(
      provider,
      config.llm.timeout,
      config.llm.retries || 3,
      config.llm.retryDelay || 1000
    );
    this.analyzer = new ReviewAnalyzer(
      this.llmClient,
      config.llm.model,
      config.llm.temperature,
      config.llm.seed,
      config.llm.maxTokens,
      config.llm.topP,
      config.review.projectContext
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
    this.warnings = [];
    const startTime = Date.now();
    logger.info({ fileCount: diffs.length, sourceBranch, targetBranch }, 'Starting code review');

    const filteredDiffs = this.filterFiles(diffs);
    const limitedDiffs = this.config.review.includeAllFiles
      ? filteredDiffs
      : filteredDiffs.slice(0, this.config.review.maxFiles);

    logger.info({ fileCount: limitedDiffs.length }, 'Files to review after filtering');

    if (limitedDiffs.length === 0) {
      logger.info('No files to review after filtering');
      const duration = Date.now() - startTime;
      return {
        summary: {
          filesReviewed: 0,
          totalIssues: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0,
          score: 10,
        },
        changeSummary: {
          totals: {
            files: 0,
            added: 0,
            deleted: 0,
            modified: 0,
            renamed: 0,
            additions: 0,
            deletions: 0,
            net: 0,
          },
          topFiles: [],
          topDirectories: [],
          narrative: 'No changes detected.',
        },
        files: [],
        metadata: {
          timestamp: new Date().toISOString(),
          sourceBranch,
          targetBranch,
          llmModel: this.config.llm.model,
          duration,
          warnings: this.warnings.length > 0 ? this.warnings : undefined,
        },
      };
    }

    const changeSummaryStats = buildChangeSummaryStats(limitedDiffs, {
      directoryDepth: this.config.review.directoryDepth ?? 2,
    });
    const changeNarrative = await this.buildChangeNarrative(limitedDiffs, changeSummaryStats);
    const changeSummary = { ...changeSummaryStats, narrative: changeNarrative };

    const fileReviews = await this.reviewFilesWithContextAwareGrouping(limitedDiffs);
    const allIssues = fileReviews.flatMap((fr) => fr.issues);
    const summary = generateSummary(fileReviews.length, allIssues);

    const duration = Date.now() - startTime;

    const result: ReviewResult = {
      summary,
      changeSummary,
      files: fileReviews,
      metadata: {
        timestamp: new Date().toISOString(),
        sourceBranch,
        targetBranch,
        llmModel: this.config.llm.model,
        duration,
        warnings: this.warnings.length > 0 ? this.warnings : undefined,
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
    if (this.config.review.includeAllFiles) {
      return diffs;
    }

    return diffs.filter((diff) => {
      for (const pattern of this.config.review.excludePatterns) {
        if (minimatch(diff.filePath, pattern)) {
          logger.debug({ filePath: diff.filePath, pattern }, 'File excluded');
          return false;
        }
      }

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
   * Review files with context-aware grouping
   * Groups related files together for cross-file analysis
   */
  private async reviewFilesWithContextAwareGrouping(diffs: DiffInfo[]): Promise<FileReview[]> {
    const groupingOptions: GroupingOptions = {
      enabled: this.config.review.contextAware ?? true,
      groupByDirectory: this.config.review.groupByDirectory ?? true,
      groupByFeature: this.config.review.groupByFeature ?? true,
      maxGroupSize: this.config.review.maxGroupSize ?? 5,
      directoryDepth: this.config.review.directoryDepth ?? 2,
    };

    const groups = groupFiles(diffs, groupingOptions);
    const concurrency = this.config.review.concurrency ?? 3;
    const results: FileReview[] = [];

    for (let i = 0; i < groups.length; i += concurrency) {
      const batch = groups.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(batch.map((group) => this.reviewGroup(group)));

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(...result.value);
        } else {
          logger.error({ error: result.reason }, 'Failed to review group');
          const groupIndex = batchResults.indexOf(result);
          // eslint-disable-next-line security/detect-object-injection
          const group = batch[groupIndex];
          this.addWarningFromError(result.reason, {
            groupType: group?.groupType,
            files: group?.files?.map((file) => file.filePath),
          });
          if (group) {
            for (const file of group.files) {
              results.push({
                path: file.filePath,
                language: file.language,
                additions: file.additions,
                deletions: file.deletions,
                issues: [],
              });
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * Review a file group (either as a group or individually)
   */
  private async reviewGroup(group: FileGroup): Promise<FileReview[]> {
    if (group.groupType === 'isolated' || group.files.length === 1) {
      return [await this.reviewSingleFile(group.files[0])];
    }

    // Review as a group for context awareness
    const groupResult = await this.reviewGroupWithContext(group);
    if (groupResult) {
      return groupResult;
    }

    // Fallback to individual reviews if group review failed
    return this.reviewGroupFilesIndividually(group.files);
  }

  /**
   * Review a group of files together with context awareness
   * Returns null if review fails (should fallback to individual reviews)
   */
  private async reviewGroupWithContext(group: FileGroup): Promise<FileReview[] | null> {
    // Type guard: ensure groupType is not 'isolated'
    if (group.groupType === 'isolated') {
      return null;
    }

    try {
      logger.debug(
        {
          groupType: group.groupType,
          context: group.context,
          fileCount: group.files.length,
        },
        'Reviewing file group with context'
      );

      const issuesByFile = await this.analyzer.analyzeFileGroup(
        group.files,
        group.groupType,
        group.context
      );

      return group.files.map((file) => ({
        path: file.filePath,
        language: file.language,
        additions: file.additions,
        deletions: file.deletions,
        issues: issuesByFile.get(file.filePath) || [],
      }));
    } catch (error) {
      logger.error(
        {
          groupType: group.groupType,
          error: error instanceof Error ? error.message : String(error),
        },
        'Group review failed, falling back to individual reviews'
      );
      this.addWarningFromError(error, {
        groupType: group.groupType,
        files: group.files.map((file) => file.filePath),
      });
      return null;
    }
  }

  /**
   * Review files individually as fallback
   */
  private async reviewGroupFilesIndividually(files: DiffInfo[]): Promise<FileReview[]> {
    const results = await Promise.allSettled(files.map((file) => this.reviewSingleFile(file)));

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }

      // eslint-disable-next-line security/detect-object-injection
      const file = files[index];
      logger.warn({ filePath: file.filePath }, 'Failed to review file individually');
      this.addWarningFromError(result.reason, { filePath: file.filePath });
      return {
        path: file.filePath,
        language: file.language,
        additions: file.additions,
        deletions: file.deletions,
        issues: [],
      };
    });
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
      this.addWarningFromError(error, { filePath: diff.filePath });

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

  private async buildChangeNarrative(
    diffs: DiffInfo[],
    summary: ChangeSummaryStats
  ): Promise<string> {
    if (diffs.length === 0) {
      return 'No changes detected.';
    }

    const mode = this.config.review.changeSummaryMode ?? 'deterministic';
    if (mode === 'deterministic') {
      return buildDeterministicNarrative(summary);
    }

    try {
      return await this.analyzer.summarizeChanges(diffs, summary);
    } catch (error) {
      logger.warn(
        { error: error instanceof Error ? error.message : String(error) },
        'Failed to generate change summary narrative'
      );
      this.addWarningFromError(error, { groupType: 'summary' });
      return 'Change summary narrative unavailable due to an error.';
    }
  }

  private addWarningFromError(
    error: unknown,
    context: { filePath?: string; groupType?: string; files?: string[] }
  ): void {
    const message = error instanceof Error ? error.message : String(error);
    const code =
      error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
        ? (error.code as string)
        : 'LLM_ERROR';
    const details = error instanceof Error ? undefined : error;
    this.warnings.push({
      code,
      message,
      details: context.files ? { files: context.files, details } : details,
      filePath: context.filePath,
      groupType: context.groupType,
    });
  }
}
