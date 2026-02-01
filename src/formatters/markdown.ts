/**
 * Markdown output formatter
 */

import type { ReviewResult, FileReview, Issue } from '../types/review.js';
import chalk from 'chalk';

const SEVERITY_EMOJIS: Record<Issue['severity'], string> = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🔵',
  info: 'ℹ️',
};

const SEVERITY_LABELS: Record<Issue['severity'], string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
};

export function formatMarkdown(result: ReviewResult, colorize = false): string {
  const lines: string[] = [];

  // Header
  lines.push('# Code Review Report');
  lines.push('');
  lines.push(`**Generated:** ${result.metadata.timestamp}`);
  lines.push(`**Source Branch:** ${result.metadata.sourceBranch}`);
  lines.push(`**Target Branch:** ${result.metadata.targetBranch}`);
  lines.push(`**Model:** ${result.metadata.llmModel}`);
  lines.push(`**Duration:** ${result.metadata.duration}ms`);
  lines.push('');

  // Summary
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

  // Files with issues
  const filesWithIssues = result.files.filter((f) => f.issues.length > 0);
  if (filesWithIssues.length > 0) {
    lines.push('## Issues by File');
    lines.push('');

    for (const file of filesWithIssues) {
      lines.push(`### ${file.path}`);
      lines.push('');
      lines.push(
        `*Language:* ${file.language} | *Changes:* +${file.additions} -${file.deletions}`
      );
      lines.push('');

      for (const issue of file.issues) {
        const emoji = SEVERITY_EMOJIS[issue.severity];
        const label = SEVERITY_LABELS[issue.severity];
        lines.push(
          `#### ${emoji} ${label} - ${issue.category} ${issue.line > 0 ? `(Line ${issue.line})` : ''}`
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
    lines.push('## ✅ No Issues Found');
    lines.push('');
    lines.push('Great job! No issues were detected in the code changes.');
    lines.push('');
  }

  return lines.join('\n');
}
