/**
 * LLM client wrapper with timeout and retry logic
 */

import type { LLMProvider, AnalyzeRequest, AnalyzeResponse } from '../../types/llm.js';
import { LLMError } from '../../utils/errors.js';
import { withRetry } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export class LLMClient {
  constructor(
    private readonly provider: LLMProvider,
    private readonly timeout: number,
    private readonly retries: number = 3,
    private readonly retryDelay: number = 1000
  ) {}

  async analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    logger.debug(
      { model: request.model, provider: this.provider.name },
      'Sending analysis request to LLM'
    );

    const startTime = Date.now();

    let timeoutId: NodeJS.Timeout | null = null;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new LLMError(`Request timeout after ${this.timeout}ms`)),
          this.timeout
        );
      });

      const response = await Promise.race([
        withRetry(() => this.provider.analyze(request), {
          retries: this.retries,
          delay: this.retryDelay,
          onError: (error, attempt) => {
            logger.warn({ attempt, error: error.message }, 'LLM request failed, retrying');
          },
        }),
        timeoutPromise,
      ]);

      const duration = Date.now() - startTime;
      logger.info(
        {
          duration,
          provider: this.provider.name,
          usage: response.usage,
        },
        'LLM analysis completed'
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(
        {
          duration,
          provider: this.provider.name,
          error: error instanceof Error ? error.message : String(error),
        },
        'LLM analysis failed'
      );

      if (error instanceof LLMError) {
        throw error;
      }

      throw new LLMError(
        `LLM analysis failed: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    let timeoutId: NodeJS.Timeout | null = null;
    try {
      const timeoutPromise = new Promise<boolean>((resolve) => {
        timeoutId = setTimeout(() => resolve(false), 5000);
      });

      return await Promise.race([this.provider.healthCheck(), timeoutPromise]);
    } catch {
      return false;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
}
