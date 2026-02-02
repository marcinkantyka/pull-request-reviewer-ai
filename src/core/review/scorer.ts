/**
 * Issue scoring and severity calculation
 */

import type { Issue, ReviewSummary } from '../../types/review.js';
import type { SeverityLevel } from '../../types/config.js';

const SEVERITY_WEIGHTS: Record<SeverityLevel, number> = {
  critical: 10,
  high: 7,
  medium: 4,
  low: 2,
  info: 1,
};

const MAX_SCORE = 10;

/**
 * Calculate review score based on issues
 * Score ranges from 0 (worst) to 10 (best)
 */
export function calculateScore(issues: Issue[]): number {
  if (issues.length === 0) {
    return MAX_SCORE;
  }

  const totalPenalty = issues.reduce((sum, issue) => {
    return sum + SEVERITY_WEIGHTS[issue.severity];
  }, 0);

  const penaltyFactor = Math.min(totalPenalty / 100, 1);
  const score = MAX_SCORE * (1 - penaltyFactor);

  return Math.max(0, Math.round(score * 10) / 10);
}

/**
 * Generate review summary from issues
 */
export function generateSummary(filesReviewed: number, issues: Issue[]): ReviewSummary {
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  for (const issue of issues) {
    severityCounts[issue.severity]++;
  }

  return {
    filesReviewed,
    totalIssues: issues.length,
    critical: severityCounts.critical,
    high: severityCounts.high,
    medium: severityCounts.medium,
    low: severityCounts.low,
    info: severityCounts.info,
    score: calculateScore(issues),
  };
}
