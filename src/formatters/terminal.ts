/**
 * Terminal output formatter with colors
 */

import type { ReviewResult, Issue } from '../types/review.js';
import chalk from 'chalk';

const SEVERITY_ICONS: Record<Issue['severity'], string> = {
  critical: '[CRITICAL]',
  high: '[HIGH]',
  medium: '[MEDIUM]',
  low: '[LOW]',
  info: '[INFO]',
};

function createNoColor(): typeof chalk {
  const passthrough = (text: string): string => text;
  const withBold = Object.assign(passthrough, { bold: passthrough });
  return {
    red: withBold,
    yellow: withBold,
    blue: passthrough,
    gray: passthrough,
    green: withBold,
    bold: passthrough,
    dim: passthrough,
  } as typeof chalk;
}

export function formatTerminal(result: ReviewResult, colorize = true, showDiff = false): string {
  const lines: string[] = [];
  const color = colorize ? chalk : createNoColor();
  const severityColors: Record<Issue['severity'], (text: string) => string> = {
    critical: color.red.bold,
    high: color.red,
    medium: color.yellow,
    low: color.blue,
    info: color.gray,
  };

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

  lines.push(color.bold('  Change Summary'));
  lines.push(color.dim('  ─'.repeat(40)));
  lines.push(
    `  Files Changed: ${result.changeSummary.totals.files} (added ${result.changeSummary.totals.added}, deleted ${result.changeSummary.totals.deleted}, modified ${result.changeSummary.totals.modified}, renamed ${result.changeSummary.totals.renamed})`
  );
  lines.push(
    `  Lines: +${result.changeSummary.totals.additions} -${result.changeSummary.totals.deletions} (net ${result.changeSummary.totals.net})`
  );
  lines.push('');

  lines.push('  Top Files by Churn:');
  if (result.changeSummary.topFiles.length === 0) {
    lines.push('    None');
  } else {
    for (const file of result.changeSummary.topFiles) {
      lines.push(`    ${file.path} (${file.changeType}) +${file.additions} -${file.deletions}`);
    }
  }
  lines.push('');

  lines.push('  Top Directories:');
  if (result.changeSummary.topDirectories.length === 0) {
    lines.push('    None');
  } else {
    for (const directory of result.changeSummary.topDirectories) {
      lines.push(
        `    ${directory.path} (files ${directory.files}) +${directory.additions} -${directory.deletions}`
      );
    }
  }
  lines.push('');

  lines.push('  Narrative:');
  const narrativeLines = result.changeSummary.narrative.split('\n');
  for (const line of narrativeLines) {
    lines.push(`    ${line}`);
  }
  lines.push('');

  lines.push(color.bold('  Summary'));
  lines.push(color.dim('  ─'.repeat(40)));
  lines.push(`  Files Reviewed: ${result.summary.filesReviewed}`);
  lines.push(`  Total Issues:   ${result.summary.totalIssues}`);
  lines.push('');

  if (result.summary.totalIssues > 0) {
    lines.push('  Issues by Severity:');
    if (result.summary.critical > 0) {
      lines.push(`    ${severityColors.critical('Critical')}: ${result.summary.critical}`);
    }
    if (result.summary.high > 0) {
      lines.push(`    ${severityColors.high('High')}: ${result.summary.high}`);
    }
    if (result.summary.medium > 0) {
      lines.push(`    ${severityColors.medium('Medium')}: ${result.summary.medium}`);
    }
    if (result.summary.low > 0) {
      lines.push(`    ${severityColors.low('Low')}: ${result.summary.low}`);
    }
    if (result.summary.info > 0) {
      lines.push(`    ${severityColors.info('Info')}: ${result.summary.info}`);
    }
    lines.push('');
  }

  const scoreColor =
    result.summary.score >= 8 ? color.green : result.summary.score >= 6 ? color.yellow : color.red;
  lines.push(`  Score: ${scoreColor.bold(`${result.summary.score}/10`)}`);
  lines.push('');

  const filesWithIssues = result.files.filter((f) => f.issues.length > 0);
  if (filesWithIssues.length > 0) {
    lines.push(color.bold('  Issues by File'));
    lines.push(color.dim('  ─'.repeat(40)));
    lines.push('');

    for (const file of filesWithIssues) {
      lines.push(
        color.bold(`  File: ${file.path}`) +
          ` (${file.language}) +${file.additions} -${file.deletions}`
      );
      lines.push('');

      for (const issue of file.issues) {
        const icon = SEVERITY_ICONS[issue.severity];
        const severityColor = severityColors[issue.severity];
        const lineInfo = issue.line > 0 ? `:${issue.line}` : '';

        lines.push(
          `    ${icon} ${severityColor(issue.severity.toUpperCase())} [${issue.category}]${lineInfo}`
        );
        lines.push(`       ${issue.message}`);

        if (issue.suggestion) {
          lines.push(color.dim(`       Suggestion: ${issue.suggestion}`));
        }

        if (issue.code && showDiff) {
          lines.push(color.dim(`       Code: ${issue.code}`));
        }

        lines.push('');
      }
    }
  } else {
    lines.push(color.bold('  No Issues Found'));
    lines.push('');
    lines.push('  No issues were detected in the code changes.');
    lines.push('');
  }

  lines.push(color.bold('═'.repeat(80)));
  lines.push('');

  return lines.join('\n');
}
