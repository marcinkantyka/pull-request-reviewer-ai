/**
 * Custom error types for PR Review CLI
 */

export class PRReviewError extends Error {
  public readonly code: string;
  public readonly details?: unknown;
  public readonly recoverable: boolean;

  constructor(
    message: string,
    code: string,
    details?: unknown,
    recoverable = false
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.recoverable = recoverable;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class NetworkSecurityError extends PRReviewError {
  constructor(message: string, details?: unknown) {
    super(message, 'NETWORK_SECURITY', details, false);
  }
}

export class GitError extends PRReviewError {
  constructor(message: string, details?: unknown) {
    super(message, 'GIT_ERROR', details, true);
  }
}

export class LLMError extends PRReviewError {
  constructor(message: string, details?: unknown) {
    super(message, 'LLM_ERROR', details, true);
  }
}

export class ConfigError extends PRReviewError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFIG_ERROR', details, false);
  }
}

export class ValidationError extends PRReviewError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details, false);
  }
}

/**
 * Retry wrapper for recoverable operations
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    retries: number;
    delay: number;
    onError?: (error: Error, attempt: number) => void;
  }
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= options.retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (error instanceof PRReviewError && !error.recoverable) {
        throw error; // Don't retry non-recoverable errors
      }

      if (attempt < options.retries) {
        options.onError?.(error as Error, attempt);
        await new Promise((resolve) => setTimeout(resolve, options.delay));
      }
    }
  }

  throw lastError!;
}
