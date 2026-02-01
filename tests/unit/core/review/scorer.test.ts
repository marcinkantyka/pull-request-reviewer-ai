/**
 * Scorer tests
 */

import { describe, it, expect } from 'vitest';
import { calculateScore, generateSummary } from '../../../src/core/review/scorer.js';
import type { Issue } from '../../../src/types/review.js';

describe('Scorer', () => {
  describe('calculateScore', () => {
    it('should return 10 for no issues', () => {
      expect(calculateScore([])).toBe(10);
    });

    it('should return lower score for critical issues', () => {
      const issues: Issue[] = [
        {
          line: 1,
          severity: 'critical',
          category: 'security',
          message: 'SQL injection vulnerability',
        },
      ];
      const score = calculateScore(issues);
      expect(score).toBeLessThan(10);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should return lower score for more issues', () => {
      const fewIssues: Issue[] = [
        { line: 1, severity: 'high', category: 'bugs', message: 'Bug 1' },
      ];
      const manyIssues: Issue[] = [
        { line: 1, severity: 'high', category: 'bugs', message: 'Bug 1' },
        { line: 2, severity: 'high', category: 'bugs', message: 'Bug 2' },
        { line: 3, severity: 'high', category: 'bugs', message: 'Bug 3' },
      ];

      const scoreFew = calculateScore(fewIssues);
      const scoreMany = calculateScore(manyIssues);

      expect(scoreMany).toBeLessThan(scoreFew);
    });
  });

  describe('generateSummary', () => {
    it('should generate correct summary', () => {
      const issues: Issue[] = [
        { line: 1, severity: 'critical', category: 'security', message: 'Critical issue' },
        { line: 2, severity: 'high', category: 'bugs', message: 'High issue' },
        { line: 3, severity: 'medium', category: 'style', message: 'Medium issue' },
        { line: 4, severity: 'low', category: 'style', message: 'Low issue' },
        { line: 5, severity: 'info', category: 'bestPractices', message: 'Info issue' },
      ];

      const summary = generateSummary(5, issues);

      expect(summary.filesReviewed).toBe(5);
      expect(summary.totalIssues).toBe(5);
      expect(summary.critical).toBe(1);
      expect(summary.high).toBe(1);
      expect(summary.medium).toBe(1);
      expect(summary.low).toBe(1);
      expect(summary.info).toBe(1);
      expect(summary.score).toBeGreaterThanOrEqual(0);
      expect(summary.score).toBeLessThanOrEqual(10);
    });
  });
});
