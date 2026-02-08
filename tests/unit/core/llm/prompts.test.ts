import { describe, it, expect } from 'vitest';
import {
  createReviewPrompt,
  createGroupReviewPrompt,
  createChangeSummaryPrompt,
} from '../../../../src/core/llm/prompts.js';
import type { ChangeSummaryStats, DiffInfo } from '../../../../src/types/review.js';

describe('LLM prompt helpers', () => {
  it('adds documentation guidance for markdown files', () => {
    const prompt = createReviewPrompt('README.md', 'markdown', '+ Added docs', 'Project context');
    expect(prompt).toContain('Documentation guidance');
    expect(prompt).toContain('Do NOT report runtime');
  });

  it('does not add documentation guidance for code files', () => {
    const prompt = createReviewPrompt('src/index.ts', 'typescript', '+ const value = 1;');
    expect(prompt).not.toContain('Documentation guidance');
  });

  it('includes project context in file prompt', () => {
    const prompt = createReviewPrompt(
      'src/index.ts',
      'typescript',
      '+ const value = 1;',
      'Project context: Use internal auth'
    );
    expect(prompt).toContain('Project context:');
    expect(prompt).toContain('Use internal auth');
  });

  it('includes project context and doc guidance in group prompt', () => {
    const files = [
      {
        filePath: 'README.md',
        language: 'markdown',
        diff: '+ Docs',
      },
      {
        filePath: 'src/index.ts',
        language: 'typescript',
        diff: '+ const value = 1;',
      },
    ];
    const prompt = createGroupReviewPrompt(files, 'directory', 'src', 'Project context note');
    expect(prompt).toContain('Project context:');
    expect(prompt).toContain('Project context note');
    expect(prompt).toContain('Documentation guidance');
  });

  it('includes project context in change summary prompt', () => {
    const diffs: DiffInfo[] = [
      {
        filePath: 'src/index.ts',
        language: 'typescript',
        additions: 1,
        deletions: 0,
        diff: '+ const value = 1;',
        changeType: 'modified',
      },
    ];
    const summary: ChangeSummaryStats = {
      totals: {
        files: 1,
        added: 0,
        deleted: 0,
        modified: 1,
        renamed: 0,
        additions: 1,
        deletions: 0,
        net: 1,
      },
      topFiles: [
        {
          path: 'src/index.ts',
          changeType: 'modified',
          additions: 1,
          deletions: 0,
          totalChanges: 1,
        },
      ],
      topDirectories: [
        {
          path: 'src',
          files: 1,
          additions: 1,
          deletions: 0,
          totalChanges: 1,
        },
      ],
    };
    const prompt = createChangeSummaryPrompt(diffs, summary, 'Context for summary');
    expect(prompt).toContain('Project context:');
    expect(prompt).toContain('Context for summary');
  });
});
