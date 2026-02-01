/**
 * Diff parser tests
 */

import { describe, it, expect } from 'vitest';
import { parseDiff, detectLanguage } from '../../../../src/core/git/diff-parser.js';

describe('DiffParser', () => {
  describe('parseDiff', () => {
    it('should parse simple diff', () => {
      const diff = `diff --git a/test.ts b/test.ts
index 1234567..abcdefg 100644
--- a/test.ts
+++ b/test.ts
@@ -1,3 +1,3 @@
-const old = "old";
+const new = "new";
 console.log("test");
`;

      const result = parseDiff(diff);

      expect(result).toHaveLength(1);
      expect(result[0].filePath).toBe('test.ts');
      expect(result[0].additions).toBe(1);
      expect(result[0].deletions).toBe(1);
    });

    it('should handle multiple files', () => {
      const diff = `diff --git a/file1.ts b/file1.ts
--- a/file1.ts
+++ b/file1.ts
@@ -1 +1 @@
-old
+new

diff --git a/file2.ts b/file2.ts
--- a/file2.ts
+++ b/file2.ts
@@ -1 +1 @@
-old
+new
`;

      const result = parseDiff(diff);

      expect(result).toHaveLength(2);
      expect(result[0].filePath).toBe('file1.ts');
      expect(result[1].filePath).toBe('file2.ts');
    });
  });

  describe('detectLanguage', () => {
    it('should detect TypeScript', () => {
      expect(detectLanguage('test.ts')).toBe('typescript');
      expect(detectLanguage('test.tsx')).toBe('typescript');
    });

    it('should detect JavaScript', () => {
      expect(detectLanguage('test.js')).toBe('javascript');
      expect(detectLanguage('test.jsx')).toBe('javascript');
    });

    it('should return text for unknown extensions', () => {
      expect(detectLanguage('test.unknown')).toBe('text');
      expect(detectLanguage('test')).toBe('text');
    });
  });
});
