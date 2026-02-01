/**
 * File grouping utility for context-aware reviews
 * Groups related files together to enable cross-file analysis
 */

import type { DiffInfo } from '../../types/review.js';
import path from 'path';
import { logger } from '../../utils/logger.js';

export interface FileGroup {
  files: DiffInfo[];
  groupType: 'directory' | 'feature' | 'isolated';
  context?: string; // Directory path or feature name
}

export interface GroupingOptions {
  enabled: boolean;
  groupByDirectory: boolean;
  groupByFeature: boolean;
  maxGroupSize: number;
  directoryDepth: number; // How many directory levels to consider
}

/**
 * Groups files for context-aware review
 */
export function groupFiles(
  diffs: DiffInfo[],
  options: GroupingOptions
): FileGroup[] {
  if (!options.enabled) {
    // Return each file as isolated group
    return diffs.map((diff) => ({
      files: [diff],
      groupType: 'isolated' as const,
    }));
  }

  const groups: FileGroup[] = [];
  const processed = new Set<string>();

  for (const diff of diffs) {
    if (processed.has(diff.filePath)) {
      continue;
    }

    // Find related files
    const relatedFiles = findRelatedFiles(diff, diffs, options, processed);

    if (relatedFiles.length === 1) {
      // Isolated file
      groups.push({
        files: [diff],
        groupType: 'isolated',
      });
      processed.add(diff.filePath);
    } else {
      // Group of related files
      const groupType = determineGroupType(relatedFiles, options);
      const context = getGroupContext(relatedFiles, groupType);

      groups.push({
        files: relatedFiles,
        groupType,
        context,
      });

      // Mark all files in group as processed
      for (const file of relatedFiles) {
        processed.add(file.filePath);
      }

      logger.debug(
        {
          groupType,
          context,
          fileCount: relatedFiles.length,
          files: relatedFiles.map((f) => f.filePath),
        },
        'Created file group'
      );
    }
  }

  logger.info(
    {
      totalFiles: diffs.length,
      totalGroups: groups.length,
      groupedFiles: groups.filter((g) => g.groupType !== 'isolated').length,
      isolatedFiles: groups.filter((g) => g.groupType === 'isolated').length,
    },
    'File grouping completed'
  );

  return groups;
}

/**
 * Finds files related to the given file
 */
function findRelatedFiles(
  file: DiffInfo,
  allDiffs: DiffInfo[],
  options: GroupingOptions,
  processed: Set<string>
): DiffInfo[] {
  const related: DiffInfo[] = [file];
  const fileDir = getDirectoryPath(file.filePath, options.directoryDepth);

  for (const other of allDiffs) {
    if (other.filePath === file.filePath || processed.has(other.filePath)) {
      continue;
    }

    let isRelated = false;

    // Group by directory
    if (options.groupByDirectory) {
      const otherDir = getDirectoryPath(other.filePath, options.directoryDepth);
      if (fileDir === otherDir && fileDir !== '') {
        isRelated = true;
      }
    }

    // Group by feature (deeper directory structure)
    if (options.groupByFeature && !isRelated) {
      const fileFeature = getFeaturePath(file.filePath);
      const otherFeature = getFeaturePath(other.filePath);
      if (
        fileFeature === otherFeature &&
        fileFeature !== '' &&
        fileFeature.split('/').length >= 2
      ) {
        isRelated = true;
      }
    }

    if (isRelated && related.length < options.maxGroupSize) {
      related.push(other);
    }
  }

  return related;
}

/**
 * Gets directory path up to specified depth
 */
function getDirectoryPath(filePath: string, depth: number): string {
  const parts = filePath.split('/');
  if (parts.length <= 1) {
    return '';
  }

  // Return directory path up to depth
  const dirParts = parts.slice(0, -1); // Remove filename
  if (dirParts.length <= depth) {
    return dirParts.join('/');
  }

  return dirParts.slice(0, depth).join('/');
}

/**
 * Gets feature path (typically src/features/feature-name or src/modules/module-name)
 */
function getFeaturePath(filePath: string): string {
  const parts = filePath.split('/');

  // Look for common feature/module patterns
  const featureIndex = parts.findIndex(
    (p) => p === 'features' || p === 'modules' || p === 'components'
  );

  if (featureIndex !== -1 && featureIndex < parts.length - 2) {
    // Return path including feature name
    return parts.slice(0, featureIndex + 2).join('/');
  }

  // Fallback: use directory structure
  if (parts.length >= 3) {
    return parts.slice(0, -1).join('/');
  }

  return '';
}

/**
 * Determines the type of group
 */
function determineGroupType(
  files: DiffInfo[],
  options: GroupingOptions
): 'directory' | 'feature' | 'isolated' {
  if (files.length === 1) {
    return 'isolated';
  }

  // Check if files share a feature path
  if (options.groupByFeature) {
    const featurePaths = files.map((f) => getFeaturePath(f.filePath));
    const uniqueFeatures = new Set(featurePaths.filter((p) => p !== ''));
    if (uniqueFeatures.size === 1) {
      return 'feature';
    }
  }

  // Default to directory grouping
  return 'directory';
}

/**
 * Gets context string for the group
 */
function getGroupContext(files: DiffInfo[], groupType: string): string {
  if (files.length === 0) {
    return '';
  }

  if (groupType === 'feature') {
    const featurePath = getFeaturePath(files[0].filePath);
    return featurePath || path.dirname(files[0].filePath);
  }

  if (groupType === 'directory') {
    return path.dirname(files[0].filePath);
  }

  return '';
}
