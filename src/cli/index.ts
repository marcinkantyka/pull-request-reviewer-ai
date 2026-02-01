#!/usr/bin/env node
/**
 * PR Review CLI - Main entry point
 */

import { Command } from 'commander';
import { createCompareCommand } from './commands/compare.js';
import { createReviewCommand } from './commands/review.js';
import { createConfigCommand } from './commands/config.js';
import { logger } from '../utils/logger.js';

const program = new Command();

program
  .name('pr-review')
  .description('Offline-first Pull Request review CLI tool using local LLM')
  .version('1.0.0');

// Add commands
program.addCommand(createCompareCommand());
program.addCommand(createReviewCommand());
program.addCommand(createConfigCommand());

// Global error handler
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

// Parse arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit(0);
}
