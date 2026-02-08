#!/usr/bin/env node
/**
 * PR Review CLI - Main entry point
 */

import { Command } from 'commander';
import { createCompareCommand } from './commands/compare.js';
import { createReviewCommand } from './commands/review.js';
import { createConfigCommand } from './commands/config.js';
import { logger } from '../utils/logger.js';
import { startServer } from '../server/index.js';
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
  const defaultVersion = '1.1.0';
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

async function main(): Promise<void> {
  const version = readPackageVersion();
  const defaultHost = process.env.UI_HOST || '127.0.0.1';
  const defaultPort = process.env.UI_PORT || '0';
  const rawArgs = process.argv.slice(2);

  const getOptionValue = (flag: string, fallback: string): string => {
    const index = rawArgs.indexOf(flag);
    if (index === -1) {
      return fallback;
    }
    const value = rawArgs[index + 1];
    if (!value || value.startsWith('-')) {
      return fallback;
    }
    return value;
  };

  if (rawArgs.includes('--server')) {
    const host = getOptionValue('--host', defaultHost);
    const portRaw = getOptionValue('--port', defaultPort);
    const hasCommand = rawArgs.some((arg, index) => {
      if (arg.startsWith('-')) {
        return false;
      }
      const prev = rawArgs[index - 1];
      if (prev === '--host' || prev === '--port') {
        return false;
      }
      return true;
    });

    if (hasCommand) {
      console.error('Error: --server cannot be combined with other commands.');
      process.exit(1);
    }

    const parsedPort = Number.parseInt(portRaw, 10);
    const port = Number.isNaN(parsedPort) ? 0 : parsedPort;
    await startServer({
      host,
      port,
      version,
    });
    return;
  }
  const program = new Command();

  program
    .name('pr-review')
    .description('Offline-first Pull Request review CLI tool using local LLM')
    .version(version)
    .option('--server', 'Start local UI server')
    .option('--host <host>', 'Server host (default: 127.0.0.1)', defaultHost)
    .option('--port <port>', 'Server port (default: 0 for random)', defaultPort);

  program.addCommand(createCompareCommand());
  program.addCommand(createReviewCommand());
  program.addCommand(createConfigCommand());

  program.parse();

  if (!rawArgs.length) {
    program.outputHelp();
    process.exit(0);
  }
}

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

main().catch((error) => {
  logger.error(
    { error: error instanceof Error ? error.message : String(error) },
    'CLI failed'
  );
  console.error('Error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
