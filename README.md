# PR Review CLI

[![CI](https://github.com/marcinkantyka/pull-request-reviewer-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/marcinkantyka/pull-request-reviewer-ai/actions/workflows/ci.yml)
[![Release](https://github.com/marcinkantyka/pull-request-reviewer-ai/actions/workflows/release.yml/badge.svg)](https://github.com/marcinkantyka/pull-request-reviewer-ai/actions/workflows/release.yml)

A CLI tool that uses local LLMs to review your code changes. Everything runs offline on your machine—no data leaves your computer.

## What it does

Reviews code changes between git branches using a local LLM. It analyzes diffs, finds potential issues, and provides feedback in a format you can use in CI/CD or locally.

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

## Configuration

Create a `pr-review.config.yml` file in your project root:

```yaml
llm:
  endpoint: 'http://localhost:11434'
  provider: 'ollama'
  model: 'deepseek-coder:6.7b'
  temperature: 0.2
  timeout: 60000

review:
  maxFiles: 50
  maxLinesPerFile: 1000
  contextAware: true # Groups related files for better context
  excludePatterns:
    - '*.lock'
    - 'node_modules/**'
    - 'dist/**'
```

Or use environment variables:

```bash
export LLM_ENDPOINT=http://localhost:11434
export LLM_MODEL=deepseek-coder:6.7b
export LLM_PROVIDER=ollama
```

Run `pr-review config init` to generate a default config file.

## Commands

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
pr-review config init          # Create default config file
pr-review config get llm.endpoint
pr-review config list
```

## Options

- `--format <json|md|text>` - Output format (default: text)
- `--output <file>` - Save to file instead of stdout
- `--severity <all|high|critical>` - Filter by severity level
- `--max-files <number>` - Limit number of files to review
- `--timeout <seconds>` - LLM timeout (default: 60)
- `--verbose` - Show detailed logs
- `--exit-code` - Exit with code 1 if issues found (useful for CI)

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

```yaml
name: Code Review

on: [pull_request]

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

      - run: npm install -g pull-request-reviewer-ai
      - run: |
          curl http://localhost:11434/api/pull -d '{"name": "deepseek-coder:1.3b"}'
      - run: |
          pr-review compare ${{ github.head_ref }} ${{ github.base_ref }} \
            --format json \
            --output review.json \
            --exit-code
        env:
          LLM_ENDPOINT: http://localhost:11434
          LLM_MODEL: deepseek-coder:1.3b

      - uses: actions/upload-artifact@v3
        with:
          name: code-review
          path: review.json
```

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

Or in config:

```yaml
llm:
  timeout: 120000 # 2 minutes
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

## License

MIT
