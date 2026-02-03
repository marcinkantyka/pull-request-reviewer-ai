/**
 * Markdown output formatter
 */

import type { ReviewResult, Issue } from '../types/review.js';

const SEVERITY_PREFIXES: Record<Issue['severity'], string> = {
  critical: '[CRITICAL]',
  high: '[HIGH]',
  medium: '[MEDIUM]',
  low: '[LOW]',
  info: '[INFO]',
};

const SEVERITY_LABELS: Record<Issue['severity'], string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
};

export function formatMarkdown(result: ReviewResult, _colorize = false): string {
  const lines: string[] = [];

  lines.push('# Code Review Report');
  lines.push('');
  lines.push(`**Generated:** ${result.metadata.timestamp}`);
  lines.push(`**Source Branch:** ${result.metadata.sourceBranch}`);
  lines.push(`**Target Branch:** ${result.metadata.targetBranch}`);
  lines.push(`**Model:** ${result.metadata.llmModel}`);
  lines.push(`**Duration:** ${result.metadata.duration}ms`);
  lines.push('');

  lines.push('## Change Summary');
  lines.push('');
  lines.push(
    `**Files Changed:** ${result.changeSummary.totals.files} (Added: ${result.changeSummary.totals.added}, Deleted: ${result.changeSummary.totals.deleted}, Modified: ${result.changeSummary.totals.modified}, Renamed: ${result.changeSummary.totals.renamed})`
  );
  lines.push(
    `**Lines:** +${result.changeSummary.totals.additions} -${result.changeSummary.totals.deletions} (Net: ${result.changeSummary.totals.net})`
  );
  lines.push('');

  lines.push('**Top Files by Churn**');
  lines.push('');
  if (result.changeSummary.topFiles.length === 0) {
    lines.push('- None');
  } else {
    for (const file of result.changeSummary.topFiles) {
      lines.push(`- ${file.path} (${file.changeType}, +${file.additions} -${file.deletions})`);
    }
  }
  lines.push('');

  lines.push('**Top Directories**');
  lines.push('');
  if (result.changeSummary.topDirectories.length === 0) {
    lines.push('- None');
  } else {
    for (const directory of result.changeSummary.topDirectories) {
      lines.push(
        `- ${directory.path} (files: ${directory.files}, +${directory.additions} -${directory.deletions})`
      );
    }
  }
  lines.push('');

  lines.push('**Narrative**');
  lines.push('');
  lines.push(result.changeSummary.narrative);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Files Reviewed | ${result.summary.filesReviewed} |`);
  lines.push(`| Total Issues | ${result.summary.totalIssues} |`);
  lines.push(`| Critical | ${result.summary.critical} |`);
  lines.push(`| High | ${result.summary.high} |`);
  lines.push(`| Medium | ${result.summary.medium} |`);
  lines.push(`| Low | ${result.summary.low} |`);
  lines.push(`| Info | ${result.summary.info} |`);
  lines.push(`| **Score** | **${result.summary.score}/10** |`);
  lines.push('');

  const filesWithIssues = result.files.filter((f) => f.issues.length > 0);
  if (filesWithIssues.length > 0) {
    lines.push('## Issues by File');
    lines.push('');

    for (const file of filesWithIssues) {
      lines.push(`### ${file.path}`);
      lines.push('');
      lines.push(`*Language:* ${file.language} | *Changes:* +${file.additions} -${file.deletions}`);
      lines.push('');

      for (const issue of file.issues) {
        const prefix = SEVERITY_PREFIXES[issue.severity];
        const label = SEVERITY_LABELS[issue.severity];
        lines.push(
          `#### ${prefix} ${label} - ${issue.category} ${issue.line > 0 ? `(Line ${issue.line})` : ''}`
        );
        lines.push('');
        lines.push(issue.message);
        lines.push('');

        if (issue.suggestion) {
          lines.push('**Suggestion:**');
          lines.push('');
          lines.push(`> ${issue.suggestion}`);
          lines.push('');
        }

        if (issue.code) {
          lines.push('**Code:**');
          lines.push('');
          lines.push('```');
          lines.push(issue.code);
          lines.push('```');
          lines.push('');
        }
      }
    }
  } else {
    lines.push('## No Issues Found');
    lines.push('');
    lines.push('No issues were detected in the code changes.');
    lines.push('');
  }

  return lines.join('\n');
}
