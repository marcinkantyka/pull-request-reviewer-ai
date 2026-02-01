#!/bin/bash
# Basic usage examples for PR Review CLI
#
# Note: If running from source (not installed globally), replace 'pr-review' with:
#   node dist/cli/index.js
#
# Example: node dist/cli/index.js review --base main

# 1. Review current branch against main
pr-review review --base main

# 2. Compare two specific branches
pr-review compare feature/new-feature main

# 3. Output to JSON file
pr-review compare feature/new-feature main --format json --output review.json

# 4. Output to Markdown file
pr-review compare feature/new-feature main --format md --output review.md

# 5. Only show high and critical issues
pr-review compare feature/new-feature main --severity high

# 6. Limit number of files reviewed
pr-review compare feature/new-feature main --max-files 10

# 7. Use custom repository path
pr-review compare feature/new-feature main --repo-path /path/to/repo

# 8. Increase timeout for large reviews
pr-review compare feature/new-feature main --timeout 120

# 9. Exit with code 1 if issues found (for CI/CD)
pr-review compare feature/new-feature main --exit-code

# 10. Verbose output
pr-review compare feature/new-feature main --verbose
