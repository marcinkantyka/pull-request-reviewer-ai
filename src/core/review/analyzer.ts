/**
 * Code analysis using LLM
 */

import type { DiffInfo, Issue } from '../../types/review.js';
import type { LLMClient } from '../llm/client.js';
import { SYSTEM_PROMPT, createReviewPrompt, createGroupReviewPrompt } from '../llm/prompts.js';
import { LLMError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import path from 'path';

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
      const prompt = createReviewPrompt(diffInfo.filePath, diffInfo.language, diffInfo.diff);

      const response = await this.llmClient.analyze({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: prompt,
        temperature: this.temperature,
        model: this.model,
      });

      const issues = this.parseIssues(response.content, diffInfo.filePath);
      logger.debug(
        { filePath: diffInfo.filePath, issueCount: issues.length },
        'File analysis completed'
      );

      return issues;
    } catch (error) {
      logger.error(
        {
          filePath: diffInfo.filePath,
          error: error instanceof Error ? error.message : String(error),
        },
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
   * Analyze a group of related files together
   */
  async analyzeFileGroup(
    files: DiffInfo[],
    groupType: 'directory' | 'feature',
    context?: string
  ): Promise<Map<string, Issue[]>> {
    if (files.length === 0) {
      return new Map();
    }
    logger.debug(
      {
        fileCount: files.length,
        groupType,
        context,
        files: files.map((f) => f.filePath),
      },
      'Analyzing file group'
    );

    try {
      const prompt = createGroupReviewPrompt(
        files.map((f) => ({
          filePath: f.filePath,
          language: f.language,
          diff: f.diff,
        })),
        groupType,
        context
      );

      const response = await this.llmClient.analyze({
        systemPrompt: `${SYSTEM_PROMPT}\n\nAdditionally, you are analyzing MULTIPLE RELATED FILES together. Focus on cross-file consistency, dependencies, architectural patterns, and breaking changes that span multiple files.`,
        userPrompt: prompt,
        temperature: this.temperature,
        model: this.model,
      });

      const issuesByFile = this.parseGroupIssues(response.content, files);

      logger.debug(
        {
          fileCount: files.length,
          totalIssues: Array.from(issuesByFile.values()).flat().length,
        },
        'File group analysis completed'
      );

      return issuesByFile;
    } catch (error) {
      logger.error(
        {
          fileCount: files.length,
          error: error instanceof Error ? error.message : String(error),
        },
        'File group analysis failed'
      );

      if (error instanceof LLMError) {
        throw error;
      }

      throw new LLMError(
        `Failed to analyze file group: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * Parse issues from LLM response
   */
  private parseIssues(content: string, _filePath: string): Issue[] {
    try {
      let jsonContent = content.trim();

      if (jsonContent.startsWith('```')) {
        const lines = jsonContent.split('\n');
        const startIndex = lines.findIndex((line) => line.includes('['));
        const reversedLines = [...lines].reverse();
        const reversedEndIndex = reversedLines.findIndex((line: string) => line.includes(']'));
        const endIndex = reversedEndIndex !== -1 ? lines.length - 1 - reversedEndIndex : -1;
        if (startIndex !== -1 && endIndex !== -1) {
          jsonContent = lines.slice(startIndex, endIndex + 1).join('\n');
        }
      }

      const jsonMatch = jsonContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonContent) as unknown;

      if (!Array.isArray(parsed)) {
        logger.warn({ content }, 'LLM response is not an array');
        return [];
      }

      const issues: Issue[] = [];
      for (const item of parsed) {
        if (typeof item === 'object' && item !== null && 'severity' in item && 'message' in item) {
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
      return [];
    }
  }

  private normalizeSeverity(severity: unknown): Issue['severity'] {
    const validSeverities: Issue['severity'][] = ['critical', 'high', 'medium', 'low', 'info'];
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

  /**
   * Parse issues from group review response
   * Returns a map of file path to issues
   */
  private parseGroupIssues(content: string, files: DiffInfo[]): Map<string, Issue[]> {
    const issuesByFile = new Map<string, Issue[]>();

    for (const file of files) {
      issuesByFile.set(file.filePath, []);
    }

    try {
      let jsonContent = content.trim();

      if (jsonContent.startsWith('```')) {
        const lines = jsonContent.split('\n');
        const startIndex = lines.findIndex((line) => line.includes('['));
        const reversedLines = [...lines].reverse();
        const reversedEndIndex = reversedLines.findIndex((line: string) => line.includes(']'));
        const endIndex = reversedEndIndex !== -1 ? lines.length - 1 - reversedEndIndex : -1;
        if (startIndex !== -1 && endIndex !== -1) {
          jsonContent = lines.slice(startIndex, endIndex + 1).join('\n');
        }
      }

      const jsonMatch = jsonContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonContent) as unknown;

      if (!Array.isArray(parsed)) {
        logger.warn({ content }, 'LLM response is not an array');
        return issuesByFile;
      }

      const filePathLookup = new Map<string, string>();
      for (const file of files) {
        filePathLookup.set(file.filePath, file.filePath);
        filePathLookup.set(path.basename(file.filePath), file.filePath);
        const parts = file.filePath.split('/');
        if (parts.length > 1) {
          filePathLookup.set(parts.slice(-2).join('/'), file.filePath);
        }
      }

      for (const item of parsed) {
        if (typeof item === 'object' && item !== null && 'severity' in item && 'message' in item) {
          const issue: Issue = {
            line: typeof item.line === 'number' ? item.line : 0,
            severity: this.normalizeSeverity(item.severity),
            category: this.normalizeCategory(item.category),
            message: String(item.message || ''),
            suggestion: item.suggestion ? String(item.suggestion) : undefined,
            code: item.code ? String(item.code) : undefined,
          };

          const filePath = typeof item.file === 'string' ? item.file : files[0]?.filePath || '';

          let targetFile = filePathLookup.get(filePath);
          if (!targetFile) {
            for (const [key, value] of filePathLookup.entries()) {
              if (filePath.includes(key) || key.includes(filePath)) {
                targetFile = value;
                break;
              }
            }
          }

          if (!targetFile && files.length > 0) {
            targetFile = files[0].filePath;
            logger.warn(
              { issueFile: filePath, assignedTo: targetFile },
              'Could not match issue to file, assigning to first file'
            );
          }

          if (targetFile) {
            issuesByFile.get(targetFile)?.push(issue);
          }
        }
      }

      return issuesByFile;
    } catch (error) {
      logger.warn(
        {
          content,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to parse LLM group response as JSON'
      );
      return issuesByFile;
    }
  }
}
