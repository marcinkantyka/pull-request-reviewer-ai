/**
 * Network security validator - CRITICAL for offline operation
 * Ensures all network connections are to localhost only
 */

import { URL } from 'url';
import { NetworkSecurityError } from './errors.js';
import { logger } from './logger.js';

/**
 * Localhost address variations
 */
const LOCALHOST_ADDRESSES = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];

/**
 * Validates that an endpoint is localhost-only
 * @param endpoint - The endpoint URL to validate
 * @param allowedHosts - List of allowed hostnames
 * @throws NetworkSecurityError if endpoint is not local
 */
export function validateEndpoint(endpoint: string, allowedHosts: string[]): void {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch (error) {
    throw new NetworkSecurityError(`Invalid endpoint URL: ${endpoint}`, error);
  }

  let hostname = url.hostname.toLowerCase();

  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    hostname = hostname.slice(1, -1);
  }

  const isLocalhost = LOCALHOST_ADDRESSES.includes(hostname);
  const isAllowed = allowedHosts.some((allowed) => hostname === allowed.toLowerCase());

  if (!isLocalhost && !isAllowed) {
    const error = new NetworkSecurityError(
      `SECURITY VIOLATION: Attempted to connect to non-local endpoint: ${endpoint}. ` +
        `Only localhost connections are permitted. This ensures no code leaves your machine.`
    );
    logger.error({ endpoint, hostname, allowedHosts }, 'Network security violation');
    throw error;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new NetworkSecurityError(
      `Invalid protocol: ${url.protocol}. Only http: and https: are allowed.`
    );
  }

  logger.debug({ endpoint, hostname }, 'Network security check passed');
}

/**
 * Creates a secure fetch wrapper that validates endpoints before making requests
 * @param allowedHosts - List of allowed hostnames
 * @returns Secure fetch function
 */
export function createSecureFetch(allowedHosts: string[]) {
  return async function secureFetch(url: string, options?: RequestInit): Promise<Response> {
    validateEndpoint(url, allowedHosts);
    logger.info({ url }, 'Connecting to local endpoint');

    let timeoutController: AbortController | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    if (!options?.signal) {
      timeoutController = new AbortController();
      timeoutId = setTimeout(() => {
        timeoutController?.abort();
      }, 60000);
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: options?.signal || timeoutController?.signal,
      });
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      return response;
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('LLM request timed out');
      }
      throw error;
    }
  };
}
