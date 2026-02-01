/**
 * JSON output formatter
 */

import type { ReviewResult } from '../types/review.js';

export function formatJSON(result: ReviewResult): string {
  return JSON.stringify(result, null, 2);
}
