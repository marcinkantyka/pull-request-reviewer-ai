/**
 * LLM prompt templates for code review
 */

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
