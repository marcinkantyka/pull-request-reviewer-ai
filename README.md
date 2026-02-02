# PR Review CLI

[![CI](https://github.com/marcinkantyka/pull-request-reviewer-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/marcinkantyka/pull-request-reviewer-ai/actions/workflows/ci.yml)
[![Release](https://github.com/marcinkantyka/pull-request-reviewer-ai/actions/workflows/release.yml/badge.svg)](https://github.com/marcinkantyka/pull-request-reviewer-ai/actions/workflows/release.yml)

> **Offline-first Pull Request review CLI tool using local LLM**

A command-line tool that uses local Large Language Models (LLMs) to automatically review your code changes. Everything runs offline on your machine—no data leaves your computer, ensuring complete privacy and security.

## Description

PR Review CLI is a privacy-focused code review tool that leverages local LLMs to analyze git diffs and provide intelligent code review feedback. It integrates seamlessly with your development workflow, supporting both local usage and CI/CD pipelines.

### Key Features

- 🔒 **100% Offline**: All analysis happens locally—no data transmission to external services
- 🤖 **AI-Powered Reviews**: Uses local LLMs (Ollama, vLLM, llama.cpp) for intelligent code analysis
- 📊 **Detailed Reports**: Generates comprehensive reviews with severity levels, categories, and actionable suggestions
- 🔧 **Flexible Configuration**: Customize LLM settings, review parameters, and output formats
- 🚀 **CI/CD Ready**: Integrates with GitHub Actions and other CI/CD platforms
- 🐳 **Docker Support**: Run in containers with pre-configured setups
- 📝 **Multiple Formats**: Output in JSON, Markdown, or terminal-friendly text

### What it does

Reviews code changes between git branches using a local LLM. It analyzes diffs, finds potential issues (bugs, security vulnerabilities, code quality issues), and provides structured feedback in a format you can use in CI/CD or locally.

## Installation

### From npm

```bash
npm install -g pull-request-reviewer-ai
```

### From source

```bash
git clone https://github.com/marcinkantyka/pull-request-reviewer-ai.git
cd pull-request-reviewer-ai
npm install
npm run build
```

After building, use `node dist/cli/index.js` instead of `pr-review`, or run `npm link` to install it globally.

## Quick start

### 1. Set up a local LLM

You'll need a local LLM server running. [Ollama](https://ollama.com) is the easiest option:

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a code review model
ollama pull deepseek-coder:6.7b
```

### 2. Run a review

```bash
# Review current branch against main
pr-review review --base main

# Compare two specific branches
pr-review compare feature-branch main

# Save results to a file
pr-review compare feature-branch main --format json --output review.json
```

That's it. The tool will connect to your local LLM (default: `http://localhost:11434`) and analyze the changes.

## Example Output

Here's what a typical review looks like:

```
════════════════════════════════════════════════════════════════════════════════
  Code Review Report
════════════════════════════════════════════════════════════════════════════════

  Generated:     2026-02-01T23:17:28.119Z
  Source Branch: fix/repo_rename
  Target Branch: main
  Model:         qwen2.5-coder:7b
  Duration:      30349ms

  Summary
  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─
  Files Reviewed: 8
  Total Issues:   4

  Issues by Severity:
    Medium: 1
    Info: 3

  Score: 9.3/10

  Issues by File
  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─

  📄 .github/workflows/ci.yml (yaml) +3 -3

    ℹ️ INFO [maintainability]:88
       The Docker image name has been changed to 'pull-request-reviewer-ai:test' but the associated GitHub Secrets should also be updated for consistency.
       💡 Update ${ secrets.DOCKER_USERNAME } in .github/workflows/release.yml to match the new image name.

  📄 QUICKSTART.md (markdown) +2 -2

    ℹ️ INFO [style]:14
       The URL has been changed from 'pr-review-cli' to 'pull-request-reviewer-ai'. Ensure this change is intentional and that the repository name and description are updated accordingly.
       💡 Verify that the new repository name and description are accurate and update them if necessary.

  📄 examples/ci-integration.yml (yaml) +1 -1

    ℹ️ INFO [maintainability]:35
       The tool name has changed from 'pr-review-cli' to 'pull-request-reviewer-ai'. Ensure that the new tool is compatible with the existing workflow.
       💡 Verify compatibility and update any documentation if necessary.

  📄 src/cli/index.ts (typescript) +17 -1

    🟡 MEDIUM [maintainability]:17
       The version is hardcoded and falls back to '1.0.0' if the package.json cannot be read.
       💡 Consider using a default value or log an error message when the version cannot be determined.

════════════════════════════════════════════════════════════════════════════════
```

The report includes:

- **Summary**: Overview of files reviewed, total issues, and score
- **Issues by Severity**: Breakdown of critical, high, medium, low, and info issues
- **Issues by File**: Detailed findings for each file with line numbers, severity, category, and suggestions

## Configuration

Create a `pr-review.config.yml` file in your project root:

```yaml
llm:
  endpoint: 'http://localhost:11434'  # Ollama default
  provider: 'ollama'                   # Options: ollama, vllm, llamacpp, openai-compatible
  model: 'deepseek-coder:6.7b'
  temperature: 0.2
  timeout: 60000                        # Milliseconds
  maxTokens: 2048
  apiKey: ''                           # Optional, for secured endpoints
  streaming: false
  retries: 3
  retryDelay: 1000

network:
  allowedHosts:
    - 'localhost'
    - '127.0.0.1'
    - '::1'
  strictMode: true                     # Block non-localhost connections
  dnsBlockList: ['*']                  # Block external DNS

review:
  maxFiles: 50
  maxLinesPerFile: 1000
  excludePatterns:
    - '*.lock'
    - '*.min.js'
    - '*.min.css'
    - 'node_modules/**'
    - 'dist/**'
    - 'build/**'
    - '.git/**'
  
  # Context-aware review options
  contextAware: true                   # Enable multi-file context review
  groupByDirectory: true               # Group files in same directory
  groupByFeature: true                 # Group files by feature/module
  maxGroupSize: 5                      # Maximum files per group
  directoryDepth: 2                    # Directory levels for grouping
  concurrency: 3                       # Parallel review groups

output:
  defaultFormat: 'text'
  colorize: true
  showDiff: false
  groupByFile: true

git:
  diffContext: 3
  maxDiffSize: 10485760                # 10MB
```

### Environment Variables

You can also use environment variables instead of a config file:

```bash
export LLM_ENDPOINT=http://localhost:11434
export LLM_MODEL=deepseek-coder:6.7b
export LLM_PROVIDER=ollama
export LLM_API_KEY=your-key-here       # Optional
export LLM_TIMEOUT=60000
```

Run `pr-review config init` to generate a default config file with all available options.

## Commands

Get help for any command:
```bash
pr-review --help              # Show general help
pr-review review --help       # Show help for review command
pr-review compare --help      # Show help for compare command
pr-review config --help       # Show help for config command
```

### `review`

Review the current branch against a base branch:

```bash
pr-review review --base main
pr-review review --base develop --format json --output review.json
```

### `compare`

Compare two specific branches:

```bash
pr-review compare feature-branch main
pr-review compare feature-branch main --severity high --max-files 20
```

### `config`

Manage configuration:

```bash
pr-review config init                    # Create default config file
pr-review config init --output custom.yml # Create config with custom name
pr-review config get llm.endpoint        # Get specific config value
pr-review config list                    # List all configuration
```

## Options

Common options available for both `review` and `compare` commands:

- `--repo-path <path>` - Repository path (default: current working directory)
- `--format <json|md|text>` - Output format (default: text)
- `--output <file>` - Save to file instead of stdout
- `--config <file>` - Path to custom config file
- `--severity <all|high|critical>` - Filter by severity level (default: all)
- `--files <pattern>` - File pattern to review (glob pattern)
- `--max-files <number>` - Limit number of files to review
- `--timeout <seconds>` - LLM timeout in seconds (default: 60)
- `--verbose` - Show detailed logs
- `--no-color` - Disable colored output
- `--exit-code` - Exit with code 1 if issues found (useful for CI)

### Review Command Options

- `--base <branch>` - Base branch to compare against (default: main)

### Compare Command

Takes two required arguments:
- `<source-branch>` - Source branch to review
- `<target-branch>` - Target branch to compare against

## LLM providers

Works with any OpenAI-compatible API. Tested with:

- **Ollama** (recommended) - `http://localhost:11434`
- **vLLM** - `http://localhost:8000`
- **llama.cpp server** - `http://localhost:8080`
- **LM Studio / LocalAI** - `http://localhost:1234/v1`

Set the `provider` and `endpoint` in your config or via environment variables.

## Docker

```bash
# Build
docker build -f docker/Dockerfile -t pull-request-reviewer-ai .

# Run
docker run --rm \
  -v $(pwd):/repos:ro \
  -e LLM_ENDPOINT=http://host.docker.internal:11434 \
  pull-request-reviewer-ai compare feature main
```

See `docker/docker-compose.yml` for a complete setup with Ollama.

## CI/CD

### GitHub Actions

See `examples/ci-integration.yml` for a complete example. Here's a basic setup:

```yaml
name: Code Review

on:
  pull_request:
    branches: [main, develop]

jobs:
  review:
    runs-on: ubuntu-latest
    
    services:
      ollama:
        image: ollama/ollama:latest
        ports:
          - 11434:11434
        options: >-
          --health-cmd "curl -f http://localhost:11434/api/tags || exit 1"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for git operations

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install PR Review CLI
        run: npm install -g pull-request-reviewer-ai

      - name: Wait for Ollama
        run: |
          until curl -f http://localhost:11434/api/tags; do
            echo "Waiting for Ollama..."
            sleep 2
          done

      - name: Pull Ollama model
        run: |
          curl http://localhost:11434/api/pull -d '{"name": "deepseek-coder:1.3b"}'
        timeout-minutes: 10

      - name: Run code review
        run: |
          pr-review compare ${{ github.head_ref }} ${{ github.base_ref }} \
            --format json \
            --output review.json \
            --exit-code
        env:
          LLM_ENDPOINT: http://localhost:11434
          LLM_MODEL: deepseek-coder:1.3b
          LLM_PROVIDER: ollama
        continue-on-error: true

      - name: Upload review as artifact
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: code-review
          path: review.json
```

For a more complete example with PR comments, see `examples/ci-integration.yml`.

## Security

The tool enforces localhost-only connections. Any attempt to connect to external hosts is blocked. All code analysis happens locally—nothing leaves your machine.

## Troubleshooting

**"LLM provider is not available"**

Make sure your LLM server is running:

```bash
# For Ollama
ollama serve
curl http://localhost:11434/api/tags
```

**Timeout errors**

Increase the timeout:

```bash
pr-review compare feature main --timeout 120
```

Or in config (timeout is in milliseconds):

```yaml
llm:
  timeout: 120000  # 2 minutes (120 seconds)
```

Or via CLI:

```bash
pr-review compare feature main --timeout 120  # 120 seconds
```

**Network security errors**

The tool only allows localhost connections. Make sure your endpoint uses `localhost`, `127.0.0.1`, or `::1`.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint

# Type check
npm run typecheck
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](.github/CONTRIBUTING.md) for details on how to contribute to this project.

- 📖 [Contributing Guidelines](.github/CONTRIBUTING.md)
- 📋 [Code of Conduct](.github/CODE_OF_CONDUCT.md)
- 🔒 [Security Policy](.github/SECURITY.md)

## License

MIT
