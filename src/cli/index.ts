#!/usr/bin/env node
/**
 * PR Review CLI - Main entry point
 */

import { Command } from 'commander';
import { createCompareCommand } from './commands/compare.js';
import { createReviewCommand } from './commands/review.js';
import { createConfigCommand } from './commands/config.js';
import { logger } from '../utils/logger.js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Reads and validates version from package.json
 * Returns default version if file is missing or invalid
 */
function readPackageVersion(): string {
  const defaultVersion = '1.0.0';
  const packagePath = resolve(__dirname, '../../package.json');

  try {
    if (!existsSync(packagePath)) {
      logger.warn({ packagePath }, 'package.json not found, using default version');
      return defaultVersion;
    }

    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    const version = packageJson?.version;

    if (typeof version === 'string' && version.length > 0) {
      return version;
    }

    logger.warn('Version not found in package.json, using default version');
    return defaultVersion;
  } catch (error) {
    logger.warn(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to read version from package.json, using default version'
    );
    return defaultVersion;
  }
}

const version = readPackageVersion();

const program = new Command();

program
  .name('pr-review')
  .description('Offline-first Pull Request review CLI tool using local LLM')
  .version(version);

program.addCommand(createCompareCommand());
program.addCommand(createReviewCommand());
program.addCommand(createConfigCommand());

process.on('unhandledRejection', (error) => {
  logger.error(
    { error: error instanceof Error ? error.message : String(error) },
    'Unhandled rejection'
  );
  console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error({ error: error.message }, 'Uncaught exception');
  console.error('Uncaught error:', error.message);
  process.exit(1);
});

program.parse();

if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit(0);
}
