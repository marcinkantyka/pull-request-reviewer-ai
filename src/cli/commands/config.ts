/**
 * Config command - manage configuration
 */

import { Command } from 'commander';
import { loadConfig, DEFAULT_CONFIG } from '../../core/storage/config.js';
import { logger } from '../../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import * as yaml from 'js-yaml';

export function createConfigCommand(): Command {
  const command = new Command('config');

  command
    .description('Manage configuration')
    .command('get <key>')
    .description('Get configuration value')
    .action(async (key: string) => {
      try {
        const config = await loadConfig();
        const keys = key.split('.');
        let value: unknown = config;

        for (const k of keys) {
          if (typeof value === 'object' && value !== null && k in value) {
            value = (value as Record<string, unknown>)[k];
          } else {
            console.error(`Key not found: ${key}`);
            process.exit(1);
          }
        }

        console.log(JSON.stringify(value, null, 2));
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  command
    .command('list')
    .description('List all configuration')
    .action(async () => {
      try {
        const config = await loadConfig();
        console.log(JSON.stringify(config, null, 2));
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  command
    .command('init')
    .description('Initialize default configuration file')
    .option('--output <file>', 'Output file path', 'pr-review.config.yml')
    .action(async (options: { output?: string }) => {
      try {
        const outputPath = path.resolve(options.output || 'pr-review.config.yml');
        const yamlContent = yaml.stringify(DEFAULT_CONFIG);
        await fs.writeFile(outputPath, yamlContent, 'utf-8');
        console.log(`Configuration file created: ${outputPath}`);
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}
