/**
 * Shared CLI options
 */

import type { Command } from 'commander';

export interface CLIOptions {
  repoPath?: string;
  format?: 'text' | 'json' | 'md';
  output?: string;
  config?: string;
  severity?: 'all' | 'high' | 'critical';
  files?: string;
  maxFiles?: number;
  timeout?: number;
  verbose?: boolean;
  noColor?: boolean;
  exitCode?: boolean;
}

export function addCommonOptions(command: Command): Command {
  return command
    .option('--repo-path <path>', 'Repository path (default: cwd)')
    .option('--format <format>', 'Output format (json|md|text)', 'text')
    .option('--output <file>', 'Output file (default: stdout)')
    .option('--config <file>', 'Config file path')
    .option('--severity <level>', 'Filter by severity (all|high|critical)', 'all')
    .option('--files <pattern>', 'File pattern to review (glob)')
    .option('--max-files <number>', 'Limit files to review')
    .option('--timeout <seconds>', 'LLM timeout in seconds', '60')
    .option('--verbose', 'Verbose output')
    .option('--no-color', 'Disable colors')
    .option('--exit-code', 'Exit with code 1 if issues found');
}
