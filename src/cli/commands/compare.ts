/**
 * Compare command - compare two branches
 */

import { Command } from 'commander';
import type { CLIOptions } from '../options.js';
import { GitRepositoryManager } from '../../core/git/repo.js';
import { ReviewEngine } from '../../core/review/engine.js';
import { formatJSON, formatMarkdown, formatTerminal } from '../../formatters/index.js';
import { loadConfig } from '../../core/storage/config.js';
import { logger } from '../../utils/logger.js';
import { validateBranchName } from '../../utils/validator.js';
import { PRReviewError } from '../../utils/errors.js';
import fs from 'fs/promises';
import path from 'path';

export function createCompareCommand(): Command {
  const command = new Command('compare');

  command
    .description('Compare two git branches and generate AI-powered code review')
    .argument('<source-branch>', 'Source branch to review')
    .argument('<target-branch>', 'Target branch to compare against')
    .option('--repo-path <path>', 'Repository path (default: cwd)')
    .option('--format <format>', 'Output format (json|md|text)', 'text')
    .option('--output <file>', 'Output file (default: stdout)')
    .option('--config <file>', 'Config file path')
    .option('--severity <level>', 'Filter by severity (all|high|critical)', 'all')
    .option('--files <pattern>', 'File pattern to review (glob)')
    .option('--max-files <number>', 'Limit files to review')
    .option('--timeout <seconds>', 'LLM timeout in seconds', '60')
    .option('--verbose', 'Verbose output')
    .option('--no-color', 'Disable colors')
    .option('--exit-code', 'Exit with code 1 if issues found')
    .action(async (sourceBranch: string, targetBranch: string, options: CLIOptions) => {
      try {
        // Set log level
        if (options.verbose) {
          logger.level = 'debug';
        }

        // Validate branch names
        validateBranchName(sourceBranch);
        validateBranchName(targetBranch);

        // Load configuration
        const config = await loadConfig(options.config);

        // Override config with CLI options
        if (options.timeout) {
          config.llm.timeout = parseInt(options.timeout, 10) * 1000;
        }
        if (options.maxFiles) {
          config.review.maxFiles = options.maxFiles;
        }

        // Initialize git repository
        const repoPath = options.repoPath || process.cwd();
        const gitRepo = new GitRepositoryManager(repoPath);

        // Get diff
        logger.info({ sourceBranch, targetBranch }, 'Getting diff between branches');
        const diffs = await gitRepo.getDiff(sourceBranch, targetBranch, config.git.maxDiffSize);

        if (diffs.length === 0) {
          logger.info('No differences found between branches');
          process.exit(0);
        }

        // Initialize review engine
        const engine = new ReviewEngine(config);

        // Health check
        logger.info('Checking LLM health...');
        const isHealthy = await engine.healthCheck();
        if (!isHealthy) {
          throw new PRReviewError(
            'LLM provider is not available. Please ensure your LLM server is running.',
            'LLM_UNAVAILABLE'
          );
        }

        // Run review
        const result = await engine.review(diffs, sourceBranch, targetBranch);

        // Filter by severity if requested
        if (options.severity !== 'all') {
          const minSeverity = options.severity === 'critical' ? 'critical' : 'high';
          const severityOrder = ['critical', 'high', 'medium', 'low', 'info'];
          const minIndex = severityOrder.indexOf(minSeverity);

          result.files = result.files.map((file) => ({
            ...file,
            issues: file.issues.filter(
              (issue) => severityOrder.indexOf(issue.severity) <= minIndex
            ),
          }));

          // Recalculate summary
          const allIssues = result.files.flatMap((f) => f.issues);
          result.summary = {
            ...result.summary,
            totalIssues: allIssues.length,
            critical: allIssues.filter((i) => i.severity === 'critical').length,
            high: allIssues.filter((i) => i.severity === 'high').length,
            medium: allIssues.filter((i) => i.severity === 'medium').length,
            low: allIssues.filter((i) => i.severity === 'low').length,
            info: allIssues.filter((i) => i.severity === 'info').length,
          };
        }

        // Format output
        const format = (options.format || config.output.defaultFormat) as 'text' | 'json' | 'md';
        let output: string;

        switch (format) {
          case 'json':
            output = formatJSON(result);
            break;
          case 'md':
            output = formatMarkdown(result, !options.noColor);
            break;
          default:
            output = formatTerminal(
              result,
              !options.noColor && config.output.colorize,
              config.output.showDiff
            );
        }

        // Write output
        if (options.output) {
          const outputPath = path.resolve(options.output);
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          await fs.writeFile(outputPath, output, 'utf-8');
          logger.info({ outputPath }, 'Review written to file');
        } else {
          console.log(output);
        }

        // Exit code
        if (options.exitCode && result.summary.totalIssues > 0) {
          process.exit(1);
        }
      } catch (error) {
        logger.error(
          { error: error instanceof Error ? error.message : String(error) },
          'Compare command failed'
        );
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}
