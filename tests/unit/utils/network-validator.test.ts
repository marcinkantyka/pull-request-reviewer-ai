/**
 * Network validator tests
 */

import { describe, it, expect } from 'vitest';
import { validateEndpoint, createSecureFetch } from '../../../src/utils/network-validator.js';
import { NetworkSecurityError } from '../../../src/utils/errors.js';

describe('NetworkValidator', () => {
  describe('validateEndpoint', () => {
    it('should allow localhost endpoints', () => {
      expect(() => validateEndpoint('http://localhost:11434', ['localhost'])).not.toThrow();
      expect(() => validateEndpoint('http://127.0.0.1:11434', ['127.0.0.1'])).not.toThrow();
      // IPv6 addresses in URLs must be in brackets
      expect(() => validateEndpoint('http://[::1]:11434', ['::1'])).not.toThrow();
    });

    it('should reject non-localhost endpoints', () => {
      expect(() =>
        validateEndpoint('http://example.com:11434', ['localhost'])
      ).toThrow(NetworkSecurityError);
      expect(() =>
        validateEndpoint('http://192.168.1.1:11434', ['localhost'])
      ).toThrow(NetworkSecurityError);
    });

    it('should reject invalid protocols', () => {
      expect(() =>
        validateEndpoint('ftp://localhost:11434', ['localhost'])
      ).toThrow(NetworkSecurityError);
    });

    it('should reject invalid URLs', () => {
      expect(() => validateEndpoint('not-a-url', ['localhost'])).toThrow(
        NetworkSecurityError
      );
    });
  });

  describe('createSecureFetch', () => {
    it('should create a fetch function that validates endpoints', async () => {
      const secureFetch = createSecureFetch(['localhost', '127.0.0.1']);

      // This should not throw (even if request fails, validation passes)
      await expect(
        secureFetch('http://localhost:11434/api/test', { method: 'GET' })
      ).rejects.not.toThrow(NetworkSecurityError);

      // This should throw before making request
      await expect(
        secureFetch('http://example.com:11434/api/test', { method: 'GET' })
      ).rejects.toThrow(NetworkSecurityError);
    });
  });
});
