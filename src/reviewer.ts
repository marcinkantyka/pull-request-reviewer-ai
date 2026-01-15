import { Ollama } from 'ollama';
import * as fs from 'fs';
import * as path from 'path';
import type { PRInfo, ReviewConfig } from './types.js';

export class PRReviewer {
  private ollama: Ollama;

  constructor(private config: ReviewConfig) {
    this.ollama = new Ollama({ host: config.ollamaHost });
  }

  async waitForOllama(maxRetries: number = 30): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.ollama.list();
        return true;
      } catch (error) {
        if (i === 0) {
          console.log('Waiting for Ollama to be ready...');
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    return false;
  }

  async checkModel(): Promise<boolean> {
    try {
      const response = await this.ollama.list();
      return response.models.some(
        (m: { name: string }) => m.name === this.config.modelName
      );
    } catch (error) {
      throw new Error(`Failed to check model: ${error}`);
    }
  }

  async reviewCode(diff: string, prInfo: PRInfo): Promise<string> {
    console.log('\nAnalyzing code with Qwen2.5-Coder...\n');

    const truncatedDiff = diff.length > 20000 
      ? diff.slice(0, 20000) + '\n\n... (diff truncated for analysis)'
      : diff;

    const prompt = this.buildReviewPrompt(truncatedDiff, prInfo);

    try {
      const startTime = Date.now();
      
      const response = await this.ollama.chat({
        model: this.config.modelName,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens
        }
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`Analysis completed in ${duration}s\n`);

      return response.message.content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Review failed: ${errorMessage}`);
    }
  }

  private buildReviewPrompt(diff: string, prInfo: PRInfo): string {
    return `You are an expert code reviewer specializing in JavaScript and TypeScript.

**Pull Request Information:**
- PR #${prInfo.number}: ${prInfo.title}
- Author: ${prInfo.author}
- Branch: ${prInfo.branch} → ${prInfo.baseBranch || 'main'}

**Your Task:**
Analyze the following code diff and provide a comprehensive review covering:

1. **Code Quality**: Structure, readability, maintainability issues
2. **Potential Bugs**: Logic errors, edge cases, runtime issues  
3. **Security Concerns**: Vulnerabilities, unsafe patterns, security risks
4. **TypeScript/JavaScript Best Practices**: Standards violations, type safety
5. **Performance**: Inefficiencies, optimization opportunities
6. **Positive Aspects**: What was done well (be specific)

**Guidelines:**
- Be constructive and specific
- Provide code examples for suggestions
- Prioritize critical issues over nitpicks
- Acknowledge good practices
- Consider the context and intent

**Code Diff:**
\`\`\`diff
${diff}
\`\`\`

**Provide your review in a clear, structured format:**`;
  }

  saveReview(review: string, prInfo: PRInfo, stats: any): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `review-PR${prInfo.number}-${timestamp}.md`;
    const filepath = path.join(this.config.reviewsPath, filename);

    if (!fs.existsSync(this.config.reviewsPath)) {
      fs.mkdirSync(this.config.reviewsPath, { recursive: true });
    }

    const content = this.formatReviewDocument(review, prInfo, stats);
    fs.writeFileSync(filepath, content, 'utf-8');

    return filepath;
  }

  private formatReviewDocument(
    review: string,
    prInfo: PRInfo,
    stats: any
  ): string {
    const now = new Date();
    
    return `# Code Review: PR #${prInfo.number}

## Pull Request Details

- **Title**: ${prInfo.title}
- **Author**: ${prInfo.author}
- **Branch**: \`${prInfo.branch}\` → \`${prInfo.baseBranch || 'main'}\`
- **PR URL**: ${prInfo.url || 'N/A'}
- **Reviewed**: ${now.toLocaleString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}

## Changes Summary

- **Files Changed**: ${stats.filesChanged || 'N/A'}
- **Insertions**: +${stats.insertions || 0}
- **Deletions**: -${stats.deletions || 0}

---

## AI Review

${review}

---

## Metadata

- **Model**: ${this.config.modelName}
- **Review Type**: Automated (Local LLM)
- **Security**: Code analyzed locally, no external transmission
- **Generated**: ${now.toISOString()}

---

*This review was generated using a local AI model running on your machine. All code remained private and was not sent to any external service.*
`;
  }

  generateSummary(review: string): string {
    const lines = review.split('\n');
    const summary = lines.slice(0, 5).join('\n');
    return summary.length > 200 ? summary.slice(0, 200) + '...' : summary;
  }
}