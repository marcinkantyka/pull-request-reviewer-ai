/**
 * LLM prompt templates for code review
 */

import type { ChangeSummaryStats, DiffInfo } from '../../types/review.js';

export const SYSTEM_PROMPT = `You are an expert code reviewer analyzing git diff output showing code changes between two versions of a file.

IMPORTANT CONTEXT:
- You are reviewing CODE CHANGES (additions/modifications/deletions) from a git diff, not raw user input
- The diff shows what was added (+), removed (-), or modified in the codebase
- These are changes to existing code files in a version-controlled repository
- Focus on the CHANGES themselves, not the entire file content

Focus your analysis on:
1. Security vulnerabilities introduced by the changes (SQL injection, XSS, auth issues, insecure dependencies, input validation)
2. Logic errors and bugs in the modified code
3. Performance problems (inefficient algorithms, memory leaks, N+1 queries, missing optimizations)
4. Code quality and maintainability (complexity, readability, duplication, refactoring opportunities)
5. Best practices violations (error handling, testing, documentation, architectural patterns)

Provide specific, actionable feedback with:
- Line numbers (relative to the diff, if applicable)
- Severity level (critical/high/medium/low/info)
- Clear explanation of the issue
- Suggested fix or improvement

Format response as JSON array of issues. Only include actual issues. If the changes look good, return empty array [].`;

export const CHANGE_SUMMARY_SYSTEM_PROMPT = `You are summarizing code changes between two git branches for a developer.

Be concise, factual, and deterministic. Do not invent details that are not in the diff excerpts or file list.
If a conclusion is uncertain, say so clearly. Use a neutral, technical tone.`;

export function createReviewPrompt(
  filePath: string,
  language: string,
  diff: string,
  description?: string
): string {
  return `Review the following code changes:

File: ${filePath}
Language: ${language}
${description ? `Context: ${description}\n` : ''}
Diff:
\`\`\`diff
${diff}
\`\`\`

Provide review feedback as a JSON array with this structure:
[
  {
    "line": number,
    "severity": "critical" | "high" | "medium" | "low" | "info",
    "category": "security" | "bugs" | "performance" | "maintainability" | "style" | "bestPractices",
    "message": "Clear description of the issue",
    "suggestion": "Specific recommendation to fix"
  }
]

Only include actual issues. If code looks good, return empty array [].
Be concise but thorough. Focus on real problems, not style preferences.`;
}

/**
 * Creates a multi-file review prompt for context-aware analysis
 */
export function createGroupReviewPrompt(
  files: Array<{ filePath: string; language: string; diff: string }>,
  groupType: 'directory' | 'feature',
  context?: string
): string {
  const filesSection = files
    .map(
      (file, index) => `File ${index + 1}: ${file.filePath}
Language: ${file.language}
Diff:
\`\`\`diff
${file.diff}
\`\`\`
`
    )
    .join('\n---\n\n');

  const contextNote =
    groupType === 'feature'
      ? `These files are part of the same feature/module: ${context}`
      : `These files are in the same directory: ${context}`;

  return `Review the following related code changes together. These files are part of the same change set and should be analyzed for cross-file consistency, dependencies, and architectural patterns.

${contextNote}

${filesSection}

IMPORTANT: Analyze these files together, considering:
1. Cross-file consistency (types, interfaces, patterns)
2. Dependency relationships between files
3. Breaking changes that might affect other files
4. Architectural patterns and violations
5. Shared resources or configurations

For each issue, specify which file it belongs to using the "file" field.

Provide review feedback as a JSON array with this structure:
[
  {
    "file": "relative/path/to/file.ts",  // Which file this issue belongs to
    "line": number,
    "severity": "critical" | "high" | "medium" | "low" | "info",
    "category": "security" | "bugs" | "performance" | "maintainability" | "style" | "bestPractices",
    "message": "Clear description of the issue (mention cross-file concerns if applicable)",
    "suggestion": "Specific recommendation to fix"
  }
]

Only include actual issues. If code looks good, return empty array [].
Focus on real problems, especially cross-file issues that wouldn't be caught in isolated reviews.`;
}

/**
 * Creates a change summary prompt
 */
export function createChangeSummaryPrompt(
  diffs: DiffInfo[],
  summary: ChangeSummaryStats
): string {
  const fileList = diffs
    .map((diff) => {
      const changeType = diff.changeType || 'modified';
      return `- ${diff.filePath} (${changeType}, +${diff.additions} -${diff.deletions})`;
    })
    .join('\n');

  const topFiles = summary.topFiles
    .map((file) => `- ${file.path} (${file.changeType}, +${file.additions} -${file.deletions})`)
    .join('\n');

  const topDirectories = summary.topDirectories
    .map(
      (directory) =>
        `- ${directory.path} (files: ${directory.files}, +${directory.additions} -${directory.deletions})`
    )
    .join('\n');

  const excerpts = buildDiffExcerpts(diffs, {
    maxFiles: 8,
    maxLinesPerFile: 140,
    maxTotalLines: 900,
  });

  const omittedNote =
    excerpts.omittedCount > 0
      ? `Some diffs were omitted due to size (${excerpts.omittedCount} file(s) not shown).`
      : 'All diffs are included below.';

  return `Summarize the change set for a developer. Describe what changed in the application between the two branches.

Summary stats:
- Files changed: ${summary.totals.files}
- Added: ${summary.totals.added}
- Deleted: ${summary.totals.deleted}
- Modified: ${summary.totals.modified}
- Renamed: ${summary.totals.renamed}
- Lines: +${summary.totals.additions} -${summary.totals.deletions} (net ${summary.totals.net})

Top files by churn:
${topFiles || '- None'}

Top directories touched:
${topDirectories || '- None'}

All changed files:
${fileList || '- None'}

Diff excerpts (may be truncated):
${excerpts.text}

${omittedNote}

Output format:
1. One short paragraph (2-3 sentences) labeled "Summary:".
2. 3-5 bullet points labeled with "- " (no numbering).

Rules:
- Use concrete file names and module references when supported by the diff.
- Do not speculate about runtime behavior unless explicitly shown.
- Prefer consistent wording for similar change sets.
- If the diff does not reveal purpose, say "Purpose not explicit in diff."
Keep it practical and grounded in the diff content.`;
}

function buildDiffExcerpts(
  diffs: DiffInfo[],
  limits: { maxFiles: number; maxLinesPerFile: number; maxTotalLines: number }
): { text: string; omittedCount: number } {
  const sorted = [...diffs].sort((a, b) => {
    const aChurn = a.additions + a.deletions;
    const bChurn = b.additions + b.deletions;
    if (bChurn !== aChurn) {
      return bChurn - aChurn;
    }
    return a.filePath.localeCompare(b.filePath);
  });

  const excerpts: string[] = [];
  let totalLines = 0;
  let included = 0;

  for (const diff of sorted) {
    if (included >= limits.maxFiles || totalLines >= limits.maxTotalLines) {
      break;
    }

    const lines = diff.diff.split('\n');
    const remaining = limits.maxTotalLines - totalLines;
    const available = Math.min(lines.length, limits.maxLinesPerFile, remaining);
    if (available <= 0) {
      break;
    }

    const truncated = available < lines.length;
    const snippet = lines.slice(0, available).join('\n');
    const excerpt = `File: ${diff.filePath}
\`\`\`diff
${snippet}
${truncated ? '\n... (truncated)' : ''}
\`\`\``;

    excerpts.push(excerpt);
    totalLines += available;
    included += 1;
  }

  return {
    text: excerpts.length > 0 ? excerpts.join('\n\n') : 'No diff excerpts available.',
    omittedCount: Math.max(diffs.length - included, 0),
  };
}
