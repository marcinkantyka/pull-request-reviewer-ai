/**
 * Git diff parser
 */

import type { GitDiff } from './types.js';

/**
 * Parses git diff output into structured format
 */
export function parseDiff(diffOutput: string): GitDiff[] {
  const diffs: GitDiff[] = [];
  
  if (!diffOutput || diffOutput.trim().length === 0) {
    return diffs;
  }
  
  const lines = diffOutput.split('\n');

  let currentDiff: Partial<GitDiff> | null = null;
  let inHunk = false;
  let additions = 0;
  let deletions = 0;
  let diffLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    const line = lines[i];

    // File header
    if (line.startsWith('diff --git')) {
      // Save previous diff if exists
      if (currentDiff) {
        diffs.push({
          ...currentDiff,
          additions,
          deletions,
          diff: diffLines.join('\n'),
        } as GitDiff);
      }

      // Start new diff
      currentDiff = {};
      inHunk = false;
      additions = 0;
      deletions = 0;
      diffLines = [line];
      continue;
    }

    // File paths
    if (line.startsWith('---')) {
      const match = line.match(/^--- a\/(.+)$/);
      if (match) {
        currentDiff!.oldPath = match[1];
      }
      diffLines.push(line);
      continue;
    }

    if (line.startsWith('+++')) {
      const match = line.match(/^\+\+\+ b\/(.+)$/);
      if (match) {
        currentDiff!.newPath = match[1];
        currentDiff!.filePath = match[1];
      }
      diffLines.push(line);
      continue;
    }

    // Binary file indicator
    if (line.startsWith('Binary files')) {
      currentDiff!.binary = true;
      diffLines.push(line);
      continue;
    }

    // Hunk header
    if (line.startsWith('@@')) {
      inHunk = true;
      diffLines.push(line);
      continue;
    }

    // Diff content
    if (inHunk) {
      diffLines.push(line);
      if (line.startsWith('+') && !line.startsWith('+++')) {
        additions++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        deletions++;
      }
    }
  }

  // Save last diff
  if (currentDiff) {
    diffs.push({
      ...currentDiff,
      additions,
      deletions,
      diff: diffLines.join('\n'),
    } as GitDiff);
  }

  return diffs;
}

/**
 * Detects language from file extension
 */
export function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';

  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    java: 'java',
    go: 'go',
    rs: 'rust',
    cpp: 'cpp',
    c: 'c',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    php: 'php',
    rb: 'ruby',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    sh: 'bash',
    yml: 'yaml',
    yaml: 'yaml',
    json: 'json',
    xml: 'xml',
    html: 'html',
    css: 'css',
    sql: 'sql',
    md: 'markdown',
  };

  // eslint-disable-next-line security/detect-object-injection
  return languageMap[ext] || 'text';
}
