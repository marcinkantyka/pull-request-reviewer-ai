# PR Review CLI

[![CI](https://github.com/marcinkantyka/pull-request-reviewer-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/marcinkantyka/pull-request-reviewer-ai/actions/workflows/ci.yml)
[![Release](https://github.com/marcinkantyka/pull-request-reviewer-ai/actions/workflows/release.yml/badge.svg)](https://github.com/marcinkantyka/pull-request-reviewer-ai/actions/workflows/release.yml)
[![npm](https://img.shields.io/npm/v/pull-request-reviewer-ai?label=npm)](https://www.npmjs.com/package/pull-request-reviewer-ai)
[![Docker](https://img.shields.io/docker/v/marcinkantyka/pull-request-reviewer-ai?label=docker)](https://hub.docker.com/r/marcinkantyka/pull-request-reviewer-ai)
[![License](https://img.shields.io/github/license/marcinkantyka/pull-request-reviewer-ai)](https://github.com/marcinkantyka/pull-request-reviewer-ai/blob/main/LICENSE)

> **Offline-first Pull Request review CLI tool using local LLM**

A command-line tool that uses local Large Language Models (LLMs) to automatically review your code changes. Everything runs offline on your machine—no data leaves your computer, ensuring complete privacy and security.

## Description

PR Review CLI is a privacy-focused code review tool that leverages local LLMs to analyze git diffs and provide intelligent code review feedback. It integrates seamlessly with your development workflow, supporting both local usage and CI/CD pipelines.

### Key Features

- **Offline-first**: All analysis happens locally by default—no data transmission to external services
- **AI-Powered Reviews**: Uses local LLMs (Ollama, vLLM, llama.cpp) for intelligent code analysis
- **Detailed Reports**: Generates comprehensive reviews with severity levels, categories, and actionable suggestions
- **Flexible Configuration**: Customize LLM settings, review parameters, and output formats
- **CI/CD Ready**: Integrates with GitHub Actions and other CI/CD platforms
- **Docker Support**: Run in containers with pre-configured setups
- **Multiple Formats**: Output in JSON, Markdown, or terminal-friendly text

### What it does

Reviews code changes between git branches using a local LLM. It analyzes diffs, finds potential issues (bugs, security vulnerabilities, code quality issues), and provides structured feedback in a format you can use in CI/CD or locally.

## Contents

- Installation
- Quick start
- Configuration
- Commands
- Local UI (optional)
- LLM providers
- Docker
- CI/CD
- Security
- Troubleshooting
- Development

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

That's all you need. The tool connects to your local LLM (defaults to `http://localhost:11434`) and analyzes your changes.

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

  File: .github/workflows/ci.yml (yaml) +3 -3

    [INFO] [maintainability]:88
       The Docker image name has been changed to 'pull-request-reviewer-ai:test' but the associated GitHub Secrets should also be updated for consistency.
       Suggestion: Update ${ secrets.DOCKER_USERNAME } in .github/workflows/release.yml to match the new image name.

  File: QUICKSTART.md (markdown) +2 -2

    [INFO] [style]:14
       The URL has been changed from 'pr-review-cli' to 'pull-request-reviewer-ai'. Ensure this change is intentional and that the repository name and description are updated accordingly.
       Suggestion: Verify that the new repository name and description are accurate and update them if necessary.

  File: examples/ci-integration.yml (yaml) +1 -1

    [INFO] [maintainability]:35
       The tool name has changed from 'pr-review-cli' to 'pull-request-reviewer-ai'. Ensure that the new tool is compatible with the existing workflow.
       Suggestion: Verify compatibility and update any documentation if necessary.

  File: src/cli/index.ts (typescript) +17 -1

    [MEDIUM] [maintainability]:17
       The version is hardcoded and falls back to '1.1.0' if the package.json cannot be read.
       Suggestion: Consider using a default value or log an error message when the version cannot be determined.

════════════════════════════════════════════════════════════════════════════════
```

The report includes:

- **Summary**: Overview of files reviewed, total issues, and score
- **Issues by Severity**: Breakdown of critical, high, medium, low, and info issues
- **Issues by File**: Detailed findings for each file with line numbers, severity, category, and suggestions

## Configuration

This tool reads configuration from (in order):

1. CLI flag `--config /path/to/config.yml`
2. Project root config files: `pr-review.config.json` / `pr-review.config.yaml` / `pr-review.config.yml` / `pr-review.config.js` / `pr-review.config.ts` / `.pr-reviewrc` / `.pr-reviewrc.json` / `.pr-reviewrc.yaml` / `.pr-reviewrc.yml` / `package.json` (`pr-review` key)
3. Environment variables (override file values)

### Quick Start (Deterministic + Offline-Safe)

To make runs repeatable and keep everything local:

- Set `temperature: 0`
- Set `seed` to a fixed number
- Use `changeSummaryMode: deterministic`
- Keep `NETWORK_ALLOWED_HOSTS` to localhost or internal Docker hostnames

Example `pr-review.config.yml`:

```yaml
llm:
  endpoint: 'http://localhost:11434' # Ollama default
  provider: 'ollama' # Options: ollama, vllm, llamacpp, openai-compatible, mock
  model: 'deepseek-coder:6.7b'
  temperature: 0
  topP: 1
  timeout: 60000 # Milliseconds
  maxTokens: 2048
  apiKey: '' # Optional, for secured endpoints
  seed: 42 # Deterministic outputs
  retries: 3
  retryDelay: 1000

network:
  allowedHosts:
    - 'localhost'
    - '127.0.0.1'
    - '::1'

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
  includeAllFiles: false # Set true to ignore exclude patterns and size limits
  changeSummaryMode: deterministic # deterministic | llm
  projectContext: '' # Optional: domain rules or architecture notes to guide reviews

  # Context-aware review options
  contextAware: true # Enable multi-file context review
  groupByDirectory: true # Group files in same directory
  groupByFeature: true # Group files by feature/module
  maxGroupSize: 5 # Maximum files per group
  directoryDepth: 2 # Directory levels for grouping
  concurrency: 3 # Parallel review groups

output:
  defaultFormat: 'text'
  colorize: true
  showDiff: false

git:
  diffContext: 3
  maxDiffSize: 10485760 # 10MB

server:
  host: '127.0.0.1'
  port: 0 # 0 = random free port
```

### Environment Variables

You can also use environment variables instead of a config file:

```bash
export LLM_ENDPOINT=http://localhost:11434
export LLM_MODEL=deepseek-coder:6.7b
export LLM_PROVIDER=ollama
export LLM_API_KEY=your-key-here       # Optional
export LLM_TIMEOUT=60000
export LLM_SEED=42                     # Optional
export LLM_TOP_P=1
export LLM_MAX_TOKENS=2048
export REVIEW_PROJECT_CONTEXT="Explain domain constraints or key rules"
export NETWORK_ALLOWED_HOSTS=ollama,localhost,127.0.0.1,::1
export UI_HOST=127.0.0.1
export UI_PORT=47831
```

Run `pr-review config init` to generate a default config file with all the available options.

### Project Context (Recommended)

`review.projectContext` (or `REVIEW_PROJECT_CONTEXT`) lets you inject short, project-specific rules that the model must respect. This reduces false positives and aligns findings with how your system really works.

Use it to document architecture constraints, infrastructure protections, or known tradeoffs. Example:

```yaml
review:
  projectContext: >
    Do not flag exposed ports as security issues; the service is private behind an ALB.
    Authentication is handled by the gateway, not in this repo.
```

Or with environment variables:

```bash
export REVIEW_PROJECT_CONTEXT="Do not flag exposed ports as security issues; the service is private behind an ALB."
```

### Common Configuration Tasks

Set deterministic output:

- `llm.temperature: 0`
- `llm.seed: <fixed number>`
- `llm.topP: 1`
- `review.changeSummaryMode: deterministic`

Review every file (ignore filters):

- `review.includeAllFiles: true`

Use a different config file:

- `pr-review review --config /path/to/config.yml --base main`

Allow internal Docker hostnames:

- Add hostnames to `network.allowedHosts` or set `NETWORK_ALLOWED_HOSTS`

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

Global options:

- `--server` - Start the local UI server
- `--host <host>` - UI server host (default: 127.0.0.1)
- `--port <port>` - UI server port (default: 47831; set 0 for random)

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

## Local UI (optional)

Start a local web UI without changing the default CLI workflow:

```bash
pr-review --server
```

Default port is `47831`. If that port is busy, the server falls back to a random free port. You can always force a random port with `--port 0`. The UI is local-only by default. `--server` cannot be combined with other commands.

In UI mode, only JSON/YAML config files are accepted.

The UI compares committed branch diffs. Uncommitted working tree changes are not included.
If you use Ollama or another local provider, the UI can load available models and detect local servers automatically.
You can also generate a full `pr-review.config.yml` template from the UI (Advanced panel).

### UI Quickstart

1. Run `pr-review --server` and open the URL printed in the console.
2. Pick your repository path (or use the current directory).
3. Choose a base branch (default is `main`).
4. (Optional) Load models and pick an LLM model.
5. Click **Run Review** to generate results.

Tip: Use **Advanced** to set project-specific context and other overrides for a single run.

## LLM providers

Works with any OpenAI-compatible API. Tested with:

- **Ollama** (recommended) - `http://localhost:11434`
- **vLLM** - `http://localhost:8000`
- **llama.cpp server** - `http://localhost:8080`
- **LM Studio / LocalAI** - `http://localhost:1234`

Set the `provider` and `endpoint` in your config or via environment variables. For OpenAI-compatible servers, use the base URL (the tool will call `/v1/models` and `/v1/chat/completions`).

## Docker

### Quick Start

The easiest way to get started with Docker:

```bash
cd docker
./start.sh
```

The script handles everything for you:

- Downloads models if needed (only the first time)
- Starts services with secure internal network (no internet access)
- Blocks all outbound traffic for security

### Manual Docker Usage

```bash
# Build
docker build -f docker/Dockerfile -t pull-request-reviewer-ai .

# Run standalone
docker run --rm \
  -v $(pwd):/repos:ro \
  -e LLM_ENDPOINT=http://host.docker.internal:11434 \
  pull-request-reviewer-ai compare feature main
```

### Docker Compose

For a complete setup with Ollama and secure network isolation:

```bash
cd docker
docker-compose up
# or
docker compose up
```

The compose setup uses `internal: true` network mode, which completely blocks internet access from containers. Models are automatically downloaded on first run via `start.sh`. Check out `docker/README.md` for more details.

## CI/CD

### GitHub Actions

See `examples/ci-integration.yml` for a complete example. Here's a basic setup:

````yaml
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
          fetch-depth: 0 # Full history for git operations

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

#### Minimal offline-safe example

This version explicitly restricts outbound connections to the local Ollama service.

```yaml
name: Offline-Safe Review

on:
  pull_request:
    branches: [main]

jobs:
  review:
    runs-on: ubuntu-latest

    services:
      ollama:
        image: ollama/ollama:latest
        ports:
          - 11434:11434

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm install -g pull-request-reviewer-ai

      - run: pr-review compare ${{ github.head_ref }} ${{ github.base_ref }} --format md
        env:
          LLM_ENDPOINT: http://localhost:11434
          LLM_MODEL: deepseek-coder:1.3b
          NETWORK_ALLOWED_HOSTS: localhost,127.0.0.1,::1
````

For a more complete example with PR comments, see `examples/ci-integration.yml`.

## Security

The tool only allows connections to localhost by default. If you try to connect to an external host, it will be blocked unless you explicitly allow it in `NETWORK_ALLOWED_HOSTS`. Everything runs locally on your machine—your code never leaves your computer unless you configure a non-local endpoint.

The local UI server only accepts loopback connections, even if you bind to `0.0.0.0`.

The local UI server only accepts loopback connections. Remote network requests are blocked even if you bind to `0.0.0.0`.

## Troubleshooting

**LLM provider is not available**

If you see this error, make sure your LLM server is actually running. For Ollama, try:

```bash
ollama serve
curl http://localhost:11434/api/tags
```

**Timeout errors**

If reviews are timing out, you can increase the timeout. Either use the CLI flag:

```bash
pr-review compare feature main --timeout 120
```

Or set it in your config file (timeout is in milliseconds):

```yaml
llm:
  timeout: 120000 # 2 minutes
```

**Network security errors**

The tool only allows localhost connections. Make sure your endpoint uses `localhost`, `127.0.0.1`, or `::1`. Any other hostname will be rejected.

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

- [Contributing Guidelines](.github/CONTRIBUTING.md)
- [Code of Conduct](.github/CODE_OF_CONDUCT.md)
- [Security Policy](.github/SECURITY.md)

## License

MIT
