/**
 * LLM prompt templates for code review
 */

export const SYSTEM_PROMPT = `You are an expert code reviewer analyzing code changes.
Focus on:
1. Security vulnerabilities (SQL injection, XSS, auth issues, insecure dependencies)
2. Logic errors and bugs
3. Performance problems (inefficient algorithms, memory leaks, N+1 queries)
4. Code quality and maintainability (complexity, readability, duplication)
5. Best practices violations (error handling, testing, documentation)

Provide specific, actionable feedback with:
- Line numbers (if applicable)
- Severity level (critical/high/medium/low/info)
- Clear explanation of the issue
- Suggested fix or improvement

Format response as JSON array of issues. Only include actual issues. If code looks good, return empty array [].`;

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
