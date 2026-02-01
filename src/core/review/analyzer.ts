/**
 * Code analysis using LLM
 */

import type { DiffInfo, Issue } from '../../types/review.js';
import type { LLMClient } from '../llm/client.js';
import { createReviewPrompt } from '../llm/prompts.js';
import { LLMError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export class ReviewAnalyzer {
  constructor(
    private readonly llmClient: LLMClient,
    private readonly model: string,
    private readonly temperature: number
  ) {}

  /**
   * Analyze a single file diff
   */
  async analyzeFile(diffInfo: DiffInfo): Promise<Issue[]> {
    logger.debug({ filePath: diffInfo.filePath }, 'Analyzing file');

    try {
      const prompt = createReviewPrompt(
        diffInfo.filePath,
        diffInfo.language,
        diffInfo.diff
      );

      const response = await this.llmClient.analyze({
        systemPrompt: `You are an expert code reviewer. Analyze code changes and provide feedback as a JSON array of issues.`,
        userPrompt: prompt,
        temperature: this.temperature,
        model: this.model,
      });

      // Parse JSON response
      const issues = this.parseIssues(response.content, diffInfo.filePath);
      logger.debug(
        { filePath: diffInfo.filePath, issueCount: issues.length },
        'File analysis completed'
      );

      return issues;
    } catch (error) {
      logger.error(
        { filePath: diffInfo.filePath, error: error instanceof Error ? error.message : String(error) },
        'File analysis failed'
      );

      if (error instanceof LLMError) {
        throw error;
      }

      throw new LLMError(
        `Failed to analyze file ${diffInfo.filePath}: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * Parse issues from LLM response
   */
  private parseIssues(content: string, _filePath: string): Issue[] {
    try {
      // Try to extract JSON from response (might be wrapped in markdown)
      let jsonContent = content.trim();

      // Remove markdown code blocks if present
      if (jsonContent.startsWith('```')) {
        const lines = jsonContent.split('\n');
        const startIndex = lines.findIndex((line) => line.includes('['));
        const endIndex = lines.findLastIndex((line) => line.includes(']'));
        if (startIndex !== -1 && endIndex !== -1) {
          jsonContent = lines.slice(startIndex, endIndex + 1).join('\n');
        }
      }

      // Remove leading/trailing non-JSON text
      const jsonMatch = jsonContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonContent) as unknown;

      if (!Array.isArray(parsed)) {
        logger.warn({ content }, 'LLM response is not an array');
        return [];
      }

      // Validate and normalize issues
      const issues: Issue[] = [];
      for (const item of parsed) {
        if (
          typeof item === 'object' &&
          item !== null &&
          'severity' in item &&
          'message' in item
        ) {
          const issue: Issue = {
            line: typeof item.line === 'number' ? item.line : 0,
            severity: this.normalizeSeverity(item.severity),
            category: this.normalizeCategory(item.category),
            message: String(item.message || ''),
            suggestion: item.suggestion ? String(item.suggestion) : undefined,
            code: item.code ? String(item.code) : undefined,
          };
          issues.push(issue);
        }
      }

      return issues;
    } catch (error) {
      logger.warn(
        { content, error: error instanceof Error ? error.message : String(error) },
        'Failed to parse LLM response as JSON'
      );
      // Return empty array on parse failure (graceful degradation)
      return [];
    }
  }

  private normalizeSeverity(severity: unknown): Issue['severity'] {
    const validSeverities: Issue['severity'][] = [
      'critical',
      'high',
      'medium',
      'low',
      'info',
    ];
    const normalized = String(severity).toLowerCase();
    return validSeverities.includes(normalized as Issue['severity'])
      ? (normalized as Issue['severity'])
      : 'info';
  }

  private normalizeCategory(category: unknown): Issue['category'] {
    const validCategories: Issue['category'][] = [
      'security',
      'bugs',
      'performance',
      'maintainability',
      'style',
      'bestPractices',
    ];
    const normalized = String(category).toLowerCase();
    return validCategories.includes(normalized as Issue['category'])
      ? (normalized as Issue['category'])
      : 'bestPractices';
  }
}
