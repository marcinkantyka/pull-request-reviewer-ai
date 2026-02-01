/**
 * Terminal output formatter with colors
 */

import type { ReviewResult, FileReview, Issue } from '../types/review.js';
import chalk from 'chalk';

const SEVERITY_COLORS: Record<Issue['severity'], (text: string) => string> = {
  critical: chalk.red.bold,
  high: chalk.red,
  medium: chalk.yellow,
  low: chalk.blue,
  info: chalk.gray,
};

const SEVERITY_ICONS: Record<Issue['severity'], string> = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🔵',
  info: 'ℹ️',
};

export function formatTerminal(
  result: ReviewResult,
  colorize = true,
  showDiff = false
): string {
  const lines: string[] = [];
  const color = colorize ? chalk : { dim: (s: string) => s, bold: (s: string) => s };

  // Header
  lines.push('');
  lines.push(color.bold('═'.repeat(80)));
  lines.push(color.bold('  Code Review Report'));
  lines.push(color.bold('═'.repeat(80)));
  lines.push('');
  lines.push(`  Generated:     ${result.metadata.timestamp}`);
  lines.push(`  Source Branch: ${result.metadata.sourceBranch}`);
  lines.push(`  Target Branch: ${result.metadata.targetBranch}`);
  lines.push(`  Model:         ${result.metadata.llmModel}`);
  lines.push(`  Duration:      ${result.metadata.duration}ms`);
  lines.push('');

  // Summary
  lines.push(color.bold('  Summary'));
  lines.push(color.dim('  ─'.repeat(40)));
  lines.push(`  Files Reviewed: ${result.summary.filesReviewed}`);
  lines.push(`  Total Issues:   ${result.summary.totalIssues}`);
  lines.push('');

  if (result.summary.totalIssues > 0) {
    lines.push('  Issues by Severity:');
    if (result.summary.critical > 0) {
      lines.push(
        `    ${SEVERITY_COLORS.critical('Critical')}: ${result.summary.critical}`
      );
    }
    if (result.summary.high > 0) {
      lines.push(`    ${SEVERITY_COLORS.high('High')}: ${result.summary.high}`);
    }
    if (result.summary.medium > 0) {
      lines.push(
        `    ${SEVERITY_COLORS.medium('Medium')}: ${result.summary.medium}`
      );
    }
    if (result.summary.low > 0) {
      lines.push(`    ${SEVERITY_COLORS.low('Low')}: ${result.summary.low}`);
    }
    if (result.summary.info > 0) {
      lines.push(`    ${SEVERITY_COLORS.info('Info')}: ${result.summary.info}`);
    }
    lines.push('');
  }

  // Score
  const scoreColor =
    result.summary.score >= 8
      ? chalk.green
      : result.summary.score >= 6
        ? chalk.yellow
        : chalk.red;
  lines.push(`  Score: ${scoreColor.bold(`${result.summary.score}/10`)}`);
  lines.push('');

  // Files with issues
  const filesWithIssues = result.files.filter((f) => f.issues.length > 0);
  if (filesWithIssues.length > 0) {
    lines.push(color.bold('  Issues by File'));
    lines.push(color.dim('  ─'.repeat(40)));
    lines.push('');

    for (const file of filesWithIssues) {
      lines.push(
        color.bold(`  📄 ${file.path}`) +
          ` (${file.language}) +${file.additions} -${file.deletions}`
      );
      lines.push('');

      for (const issue of file.issues) {
        const icon = SEVERITY_ICONS[issue.severity];
        const severityColor = SEVERITY_COLORS[issue.severity];
        const lineInfo = issue.line > 0 ? `:${issue.line}` : '';

        lines.push(
          `    ${icon} ${severityColor(issue.severity.toUpperCase())} [${issue.category}]${lineInfo}`
        );
        lines.push(`       ${issue.message}`);

        if (issue.suggestion) {
          lines.push(color.dim(`       💡 ${issue.suggestion}`));
        }

        if (issue.code && showDiff) {
          lines.push(color.dim(`       Code: ${issue.code}`));
        }

        lines.push('');
      }
    }
  } else {
    lines.push(color.bold('  ✅ No Issues Found'));
    lines.push('');
    lines.push('  Great job! No issues were detected in the code changes.');
    lines.push('');
  }

  lines.push(color.bold('═'.repeat(80)));
  lines.push('');

  return lines.join('\n');
}
