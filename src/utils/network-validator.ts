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
export function validateEndpoint(
  endpoint: string,
  allowedHosts: string[]
): void {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch (error) {
    throw new NetworkSecurityError(
      `Invalid endpoint URL: ${endpoint}`,
      error
    );
  }

  let hostname = url.hostname.toLowerCase();
  
  // Strip brackets from IPv6 addresses (e.g., [::1] -> ::1)
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    hostname = hostname.slice(1, -1);
  }

  // Check if it's localhost
  const isLocalhost = LOCALHOST_ADDRESSES.includes(hostname);

  // Check if it's in allowed list
  const isAllowed = allowedHosts.some(
    (allowed) => hostname === allowed.toLowerCase()
  );

  if (!isLocalhost && !isAllowed) {
    const error = new NetworkSecurityError(
      `SECURITY VIOLATION: Attempted to connect to non-local endpoint: ${endpoint}. ` +
        `Only localhost connections are permitted. This ensures no code leaves your machine.`
    );
    logger.error({ endpoint, hostname, allowedHosts }, 'Network security violation');
    throw error;
  }

  // Validate protocol
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
  return async function secureFetch(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    // Validate before making request
    validateEndpoint(url, allowedHosts);

    // Log the request (for audit trail)
    logger.info({ url }, 'Connecting to local endpoint');

    const timeout = options?.signal || AbortSignal.timeout(60000);

    try {
      return await fetch(url, {
        ...options,
        signal: timeout,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new Error('LLM request timed out');
      }
      throw error;
    }
  };
}
