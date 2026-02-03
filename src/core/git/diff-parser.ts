/**
 * Git diff parser
 */

import type { GitDiff } from './types.js';

const DIFF_GIT_REGEX = /^diff --git (\"a\/.*?\"|a\/\S+) (\"b\/.*?\"|b\/\S+)$/;

function stripDiffPrefix(raw: string, prefix: 'a/' | 'b/'): string {
  let value = raw.trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }
  if (value.startsWith(prefix)) {
    return value.slice(prefix.length);
  }
  return value;
}

function parseDiffGitLine(line: string): { oldPath: string; newPath: string } | null {
  const match = line.match(DIFF_GIT_REGEX);
  if (!match) {
    return null;
  }

  const rawOld = match[1];
  const rawNew = match[2];

  return {
    oldPath: stripDiffPrefix(rawOld, 'a/'),
    newPath: stripDiffPrefix(rawNew, 'b/'),
  };
}

function finalizeDiff(
  currentDiff: Partial<GitDiff>,
  additions: number,
  deletions: number,
  diffLines: string[]
): GitDiff {
  if (!currentDiff.filePath) {
    currentDiff.filePath = currentDiff.newPath || currentDiff.oldPath || '';
  }

  if (!currentDiff.changeType) {
    currentDiff.changeType = 'modified';
  }

  return {
    ...currentDiff,
    additions,
    deletions,
    diff: diffLines.join('\n'),
  } as GitDiff;
}

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

    if (line.startsWith('diff --git')) {
      if (currentDiff) {
        diffs.push(finalizeDiff(currentDiff, additions, deletions, diffLines));
      }

      currentDiff = {};
      inHunk = false;
      additions = 0;
      deletions = 0;
      diffLines = [line];

      const parsed = parseDiffGitLine(line);
      if (parsed) {
        currentDiff.oldPath = parsed.oldPath;
        currentDiff.newPath = parsed.newPath;
        currentDiff.filePath = parsed.newPath;
        if (parsed.oldPath !== parsed.newPath) {
          currentDiff.changeType = 'renamed';
        }
      }
      continue;
    }

    if (line.startsWith('new file mode')) {
      currentDiff!.changeType = 'added';
      diffLines.push(line);
      continue;
    }

    if (line.startsWith('deleted file mode')) {
      currentDiff!.changeType = 'deleted';
      diffLines.push(line);
      continue;
    }

    if (line.startsWith('rename from ')) {
      currentDiff!.changeType = 'renamed';
      currentDiff!.oldPath = line.replace('rename from ', '').trim();
      diffLines.push(line);
      continue;
    }

    if (line.startsWith('rename to ')) {
      const renamedPath = line.replace('rename to ', '').trim();
      currentDiff!.changeType = 'renamed';
      currentDiff!.newPath = renamedPath;
      currentDiff!.filePath = renamedPath;
      diffLines.push(line);
      continue;
    }

    if (line.startsWith('---')) {
      const match = line.match(/^--- a\/(.+)$/);
      if (match) {
        currentDiff!.oldPath = match[1];
      }
      if (line === '--- /dev/null') {
        currentDiff!.changeType = 'added';
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
      if (line === '+++ /dev/null') {
        currentDiff!.changeType = 'deleted';
      }
      diffLines.push(line);
      continue;
    }

    if (line.startsWith('Binary files')) {
      currentDiff!.binary = true;
      diffLines.push(line);
      continue;
    }

    if (line.startsWith('@@')) {
      inHunk = true;
      diffLines.push(line);
      continue;
    }

    if (inHunk) {
      diffLines.push(line);
      if (line.startsWith('+') && !line.startsWith('+++')) {
        additions++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        deletions++;
      }
    }
  }

  if (currentDiff) {
    diffs.push(finalizeDiff(currentDiff, additions, deletions, diffLines));
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
