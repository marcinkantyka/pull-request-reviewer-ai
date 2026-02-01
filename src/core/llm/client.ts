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

    try {
      const response = await Promise.race([
        withRetry(
          () => this.provider.analyze(request),
          {
            retries: this.retries,
            delay: this.retryDelay,
            onError: (error, attempt) => {
              logger.warn(
                { attempt, error: error.message },
                'LLM request failed, retrying'
              );
            },
          }
        ),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new LLMError(`Request timeout after ${this.timeout}ms`)),
            this.timeout
          )
        ),
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
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      return await Promise.race([
        this.provider.healthCheck(),
        new Promise<boolean>((resolve) =>
          setTimeout(() => resolve(false), 5000)
        ),
      ]);
    } catch {
      return false;
    }
  }
}
