#!/usr/bin/env node

import * as readline from 'readline';
import { GitHubHelper } from './github.js';
import { PRReviewer } from './reviewer.js';
import type { ReviewConfig, PRInfo } from './types.js';

class LocalPRReviewerCLI {
  private config: ReviewConfig;
  private rl: readline.Interface;
  private githubHelper: GitHubHelper;
  private reviewer: PRReviewer;

  constructor() {
    this.config = {
      modelName: process.env.MODEL_NAME || 'qwen2.5-coder:7b',
      ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
      repoPath: process.env.REPO_PATH || '/repo',
      reviewsPath: process.env.REVIEWS_PATH || '/reviews',
      baseBranch: process.env.BASE_BRANCH || 'main',
      maxTokens: parseInt(process.env.MAX_TOKENS || '2000'),
      temperature: parseFloat(process.env.TEMPERATURE || '0.3')
    };

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.githubHelper = new GitHubHelper(this.config.repoPath);
    this.reviewer = new PRReviewer(this.config);
  }

  private displayBanner(): void {
    console.log('Local PR Reviewer');
    console.log('==================');
    console.log('');
    console.log('Security: All code analysis happens locally');
    console.log('Network: Isolated - no external connections');
    console.log(`Model: ${this.config.modelName}`);
    console.log('');
  }

  private async displayPRs(prs: PRInfo[]): Promise<void> {
    console.log('Available Branches:\n');
    
    prs.forEach((pr, index) => {
      console.log(`${index + 1}. ${pr.title}`);
      console.log(`   Author: ${pr.author} | Branch: ${pr.branch} -> ${pr.baseBranch}`);
      console.log('');
    });
  }

  private async selectPR(prs: PRInfo[]): Promise<PRInfo | null> {
    return new Promise((resolve) => {
      this.rl.question('Select PR number (or 0 to cancel): ', (answer) => {
        const selection = parseInt(answer.trim());
        
        if (selection === 0 || isNaN(selection)) {
          resolve(null);
        } else if (selection > 0 && selection <= prs.length) {
          resolve(prs[selection - 1]);
        } else {
          console.log('Invalid selection');
          resolve(null);
        }
      });
    });
  }

  private async confirm(question: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.rl.question(`${question} (y/n): `, (answer) => {
        resolve(answer.toLowerCase().trim() === 'y');
      });
    });
  }

  private displayReview(review: string): void {
    const separator = '='.repeat(80);
    console.log(`\n${separator}`);
    console.log('REVIEW RESULTS');
    console.log(separator);
    console.log('');
    console.log(review);
    console.log('');
    console.log(separator);
  }

  async run(): Promise<void> {
    try {
      this.displayBanner();

      console.log('Connecting to Ollama...');
      const ollamaReady = await this.reviewer.waitForOllama();
      
      if (!ollamaReady) {
        console.error('Cannot connect to Ollama');
        console.error('Make sure Ollama container is running:');
        console.error('docker-compose up -d ollama');
        this.rl.close();
        process.exit(1);
      }
      console.log('Connected to Ollama\n');

      console.log(`Checking for model: ${this.config.modelName}...`);
      const hasModel = await this.reviewer.checkModel();
      
      if (!hasModel) {
        console.error(`Model "${this.config.modelName}" not found`);
        console.error('Pull it with:');
        console.error(`docker-compose exec ollama ollama pull ${this.config.modelName}`);
        this.rl.close();
        process.exit(1);
      }
      console.log('Model is ready\n');

      console.log('Fetching branches...');
      const prs = await this.githubHelper.listOpenPRs();
      
      if (prs.length === 0) {
        console.log('No branches found to review');
        this.rl.close();
        return;
      }
      console.log(`Found ${prs.length} branch(es) to review\n`);

      await this.displayPRs(prs);
      const selectedPR = await this.selectPR(prs);
      
      if (!selectedPR) {
        console.log('\nReview cancelled');
        this.rl.close();
        return;
      }

      console.log(`\nSelected: ${selectedPR.title}\n`);

      const changedFiles = this.githubHelper.getChangedFiles(
        selectedPR.branch,
        selectedPR.baseBranch || this.config.baseBranch
      );

      console.log(`Files changed: ${changedFiles.length}`);
      if (changedFiles.length > 0) {
        const displayCount = Math.min(changedFiles.length, 10);
        changedFiles.slice(0, displayCount).forEach(file => {
          console.log(`  ${file}`);
        });
        if (changedFiles.length > displayCount) {
          console.log(`  ... and ${changedFiles.length - displayCount} more`);
        }
      }
      console.log('');

      const stats = this.githubHelper.getDiffStats(
        selectedPR.branch,
        selectedPR.baseBranch || this.config.baseBranch
      );

      console.log('Changes:');
      console.log(`  Files: ${stats.filesChanged}`);
      console.log(`  Insertions: +${stats.insertions}`);
      console.log(`  Deletions: -${stats.deletions}`);
      console.log('');

      const diff = this.githubHelper.getPRDiff(
        selectedPR.branch,
        selectedPR.baseBranch || this.config.baseBranch
      );

      console.log(`Diff size: ${(diff.length / 1024).toFixed(1)} KB\n`);

      const shouldReview = await this.confirm('Proceed with AI review?');
      
      if (!shouldReview) {
        console.log('\nReview cancelled');
        this.rl.close();
        return;
      }

      const review = await this.reviewer.reviewCode(diff, selectedPR);

      this.displayReview(review);

      const filepath = this.reviewer.saveReview(review, selectedPR, stats);
      console.log(`\nReview saved to: ${filepath}`);
      console.log('');

      const reviewAnother = await this.confirm('Review another branch?');
      
      if (reviewAnother) {
        console.log('\n' + '-'.repeat(80) + '\n');
        await this.run();
      } else {
        console.log('\nDone!\n');
      }

    } catch (error) {
      console.error('\nError:', (error as Error).message);
      if (process.env.DEBUG) {
        console.error('\nStack trace:', error);
      }
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }
}

const cli = new LocalPRReviewerCLI();
cli.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});