/**
 * Change summary utilities
 */

import type {
  ChangeSummaryStats,
  ChangeSummaryTotals,
  ChangeSummaryFile,
  ChangeSummaryDirectory,
  ChangeType,
  DiffInfo,
} from '../../types/review.js';

interface ChangeSummaryOptions {
  directoryDepth: number;
  topFilesLimit?: number;
  topDirectoriesLimit?: number;
}

const DEFAULT_TOP_FILES = 5;
const DEFAULT_TOP_DIRECTORIES = 5;

export function buildChangeSummaryStats(
  diffs: DiffInfo[],
  options: ChangeSummaryOptions
): ChangeSummaryStats {
  const totals = buildTotals(diffs);
  const topFiles = buildTopFiles(diffs, options.topFilesLimit ?? DEFAULT_TOP_FILES);
  const topDirectories = buildTopDirectories(
    diffs,
    options.directoryDepth,
    options.topDirectoriesLimit ?? DEFAULT_TOP_DIRECTORIES
  );

  return {
    totals,
    topFiles,
    topDirectories,
  };
}

export function buildDeterministicNarrative(summary: ChangeSummaryStats): string {
  const { totals, topFiles, topDirectories } = summary;

  const paragraph = `Change summary: ${totals.files} files changed (${totals.added} added, ${totals.deleted} deleted, ${totals.modified} modified, ${totals.renamed} renamed). Lines changed: +${totals.additions} -${totals.deletions} (net ${totals.net}).`;

  const bullets: string[] = [];
  bullets.push(`- Top files by churn: ${formatFiles(topFiles, 3)}`);
  bullets.push(`- Top directories touched: ${formatDirectories(topDirectories, 3)}`);

  const largest = topFiles[0];
  if (largest) {
    bullets.push(
      `- Largest change: ${largest.path} (${largest.changeType}, +${largest.additions} -${largest.deletions})`
    );
  } else {
    bullets.push('- Largest change: None');
  }

  return [paragraph, ...bullets].join('\n');
}

function buildTotals(diffs: DiffInfo[]): ChangeSummaryTotals {
  const totals: ChangeSummaryTotals = {
    files: diffs.length,
    added: 0,
    deleted: 0,
    modified: 0,
    renamed: 0,
    additions: 0,
    deletions: 0,
    net: 0,
  };

  for (const diff of diffs) {
    const changeType = resolveChangeType(diff);
    totals[changeType]++;
    totals.additions += diff.additions;
    totals.deletions += diff.deletions;
  }

  totals.net = totals.additions - totals.deletions;
  return totals;
}

function buildTopFiles(diffs: DiffInfo[], limit: number): ChangeSummaryFile[] {
  const files = diffs.map((diff) => {
    const totalChanges = diff.additions + diff.deletions;
    return {
      path: diff.filePath,
      changeType: resolveChangeType(diff),
      additions: diff.additions,
      deletions: diff.deletions,
      totalChanges,
    };
  });

  return files
    .sort((a, b) => b.totalChanges - a.totalChanges || a.path.localeCompare(b.path))
    .slice(0, limit);
}

function buildTopDirectories(
  diffs: DiffInfo[],
  depth: number,
  limit: number
): ChangeSummaryDirectory[] {
  const directoryStats = new Map<string, ChangeSummaryDirectory>();

  for (const diff of diffs) {
    const directory = getDirectoryPath(diff.filePath, depth);
    const entry =
      directoryStats.get(directory) ||
      ({
        path: directory,
        files: 0,
        additions: 0,
        deletions: 0,
        totalChanges: 0,
      } as ChangeSummaryDirectory);

    entry.files += 1;
    entry.additions += diff.additions;
    entry.deletions += diff.deletions;
    entry.totalChanges += diff.additions + diff.deletions;

    directoryStats.set(directory, entry);
  }

  return Array.from(directoryStats.values())
    .sort((a, b) => b.totalChanges - a.totalChanges || a.path.localeCompare(b.path))
    .slice(0, limit);
}

function getDirectoryPath(filePath: string, depth: number): string {
  const parts = filePath.split('/');
  if (parts.length <= 1) {
    return '.';
  }

  const dirParts = parts.slice(0, Math.min(parts.length - 1, depth));
  return dirParts.join('/');
}

function resolveChangeType(diff: DiffInfo): ChangeType {
  if (diff.changeType) {
    return diff.changeType;
  }

  if (diff.diff.includes('deleted file mode') || diff.diff.includes('+++ /dev/null')) {
    return 'deleted';
  }

  if (diff.diff.includes('new file mode') || diff.diff.includes('--- /dev/null')) {
    return 'added';
  }

  if (diff.diff.includes('rename from') || diff.diff.includes('rename to')) {
    return 'renamed';
  }

  return 'modified';
}

function formatFiles(files: ChangeSummaryFile[], limit: number): string {
  if (files.length === 0) {
    return 'None';
  }

  return files
    .slice(0, limit)
    .map((file) => `${file.path} (${file.changeType}, +${file.additions} -${file.deletions})`)
    .join('; ');
}

function formatDirectories(directories: ChangeSummaryDirectory[], limit: number): string {
  if (directories.length === 0) {
    return 'None';
  }

  return directories
    .slice(0, limit)
    .map(
      (directory) =>
        `${directory.path} (files ${directory.files}, +${directory.additions} -${directory.deletions})`
    )
    .join('; ');
}
