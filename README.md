# PR Review CLI

[![CI](https://github.com/your-org/pr-review-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/pr-review-cli/actions/workflows/ci.yml)
[![Release](https://github.com/your-org/pr-review-cli/actions/workflows/release.yml/badge.svg)](https://github.com/your-org/pr-review-cli/actions/workflows/release.yml)

A production-ready, fully self-hosted, offline-first Pull Request review CLI tool in TypeScript that uses local LLM for code analysis. The solution works completely offline after initial setup and ensures no code or data leaves your local machine.

## Features

- 🔒 **Offline-First**: Works completely offline after initial setup
- 🛡️ **Network Security**: Enforces localhost-only connections, no data leaves your machine
- 🤖 **Multiple LLM Providers**: Supports Ollama, vLLM, llama.cpp, and OpenAI-compatible APIs
- 📊 **Multiple Output Formats**: Human-readable terminal output, JSON, Markdown
- ⚙️ **Flexible Configuration**: YAML-based configuration with environment variable overrides
- 🐳 **Docker Support**: Multi-stage builds with security best practices
- ✅ **Production Ready**: Comprehensive error handling, logging, and testing

## Installation

### npm (Global Installation)

```bash
npm install -g pr-review-cli
```

After installation, use the `pr-review` command directly.

### From Source

```bash
git clone https://github.com/your-org/pr-review-cli.git
cd pr-review-cli
npm install
npm run build
```

**Running from source:**
After building, use `node dist/cli/index.js` instead of `pr-review`:

```bash
node dist/cli/index.js --help
node dist/cli/index.js review --base main
```

**Optional - Link globally for easier access:**

```bash
npm link
# Now you can use 'pr-review' command
pr-review --help
```

### Docker

```bash
docker pull your-org/pr-review-cli:latest
```

## Quick Start

### 1. Set up Local LLM

#### Using Ollama (Recommended)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a code review model
ollama pull deepseek-coder:6.7b
```

#### Using vLLM

```bash
docker run --gpus all -p 8000:8000 vllm/vllm-openai:latest \
  --model deepseek-ai/deepseek-coder-6.7b-instruct
```

#### Using llama.cpp Server

```bash
docker run -p 8080:8080 ghcr.io/ggerganov/llama.cpp:server \
  -m /models/deepseek-coder-6.7b-instruct-q4_k_m.gguf \
  --host 0.0.0.0 --port 8080
```

### 2. Configure PR Review CLI

```bash
# Initialize default config (after building)
npm run build
node dist/cli/index.js config init

# Or set via environment variables
export LLM_ENDPOINT=http://localhost:11434
export LLM_MODEL=deepseek-coder:6.7b
export LLM_PROVIDER=ollama
```

### 3. Run Your First Review

**When running from source (after `npm run build`):**

```bash
# Review current branch against main
node dist/cli/index.js review --base main

# Compare two specific branches
node dist/cli/index.js compare feature/new-feature main

# Output to file
node dist/cli/index.js compare feature/new-feature main --format json --output review.json
```

**When installed globally (after `npm link` or `npm install -g`):**

```bash
# Review current branch against main
pr-review review --base main

# Compare two specific branches
pr-review compare feature/new-feature main
```

## Configuration

### Configuration File

Create `pr-review.config.yml` in your project root:

```yaml
llm:
  endpoint: 'http://localhost:11434'
  provider: 'ollama'
  model: 'deepseek-coder:6.7b'
  temperature: 0.2
  timeout: 60000

network:
  allowedHosts:
    - 'localhost'
    - '127.0.0.1'
    - '::1'
  strictMode: true

review:
  maxFiles: 50
  maxLinesPerFile: 1000
  excludePatterns:
    - '*.lock'
    - 'node_modules/**'
    - 'dist/**'

output:
  defaultFormat: 'text'
  colorize: true
  showDiff: false
```

### Environment Variables

All configuration can be overridden via environment variables:

- `LLM_ENDPOINT`: LLM server endpoint
- `LLM_PROVIDER`: Provider type (ollama, vllm, llamacpp, openai-compatible)
- `LLM_MODEL`: Model name
- `LLM_TEMPERATURE`: Temperature (0-2)
- `LLM_TIMEOUT`: Timeout in milliseconds
- `LLM_API_KEY`: API key (if required)
- `NETWORK_STRICT_MODE`: Enable strict network mode

## CLI Commands

### Compare Branches

**When running from source:**

```bash
node dist/cli/index.js compare <source-branch> <target-branch> [options]
```

**When installed globally:**

```bash
pr-review compare <source-branch> <target-branch> [options]
```

**Options:**

- `--repo-path <path>`: Repository path (default: cwd)
- `--format <json|md|text>`: Output format (default: text)
- `--output <file>`: Output file (default: stdout)
- `--severity <all|high|critical>`: Filter by severity
- `--max-files <number>`: Limit files to review
- `--timeout <seconds>`: LLM timeout
- `--verbose`: Verbose output
- `--no-color`: Disable colors
- `--exit-code`: Exit with code 1 if issues found

### Review Current Branch

**When running from source:**

```bash
node dist/cli/index.js review --base <branch> [options]
```

**When installed globally:**

```bash
pr-review review --base <branch> [options]
```

Review current branch against a base branch (default: main).

### Configuration Management

**When running from source:**

```bash
# Get configuration value
node dist/cli/index.js config get llm.endpoint

# List all configuration
node dist/cli/index.js config list

# Initialize default config file
node dist/cli/index.js config init
```

**When installed globally:**

```bash
# Get configuration value
pr-review config get llm.endpoint

# List all configuration
pr-review config list

# Initialize default config file
pr-review config init
```

## Docker Usage

### Basic Docker Compose

```bash
# Start Ollama and PR Review CLI
docker-compose -f docker/docker-compose.yml up

# Run a review
docker-compose -f docker/docker-compose.yml run pr-review \
  compare feature/new-feature main \
  --repo-path /repos/my-project \
  --format json \
  --output /output/review.json
```

### Offline Docker Setup

For completely air-gapped environments:

```bash
# 1. Download models while online
docker run -v ollama-data:/root/.ollama ollama/ollama pull deepseek-coder:6.7b

# 2. Disconnect from internet

# 3. Run offline
docker-compose -f docker/docker-compose.offline.yml up
```

### Custom Docker Build

```bash
# Build image
docker build -f docker/Dockerfile -t pr-review-cli .

# Run
docker run --rm \
  -v $(pwd):/repos:ro \
  -v $(pwd)/config:/config:ro \
  -v $(pwd)/output:/output \
  -e LLM_ENDPOINT=http://host.docker.internal:11434 \
  pr-review-cli compare feature main
```

## CI/CD Integration

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
        options: >-
          --health-cmd "curl -f http://localhost:11434/api/tags || exit 1"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install PR Review CLI
        run: npm install -g pr-review-cli

      - name: Pull Ollama model
        run: |
          curl http://localhost:11434/api/pull -d '{"name": "deepseek-coder:1.3b"}'

      - name: Run code review
        run: |
          pr-review compare ${{ github.head_ref }} ${{ github.base_ref }} \
            --format json \
            --output review.json \
            --exit-code
        env:
          LLM_ENDPOINT: http://localhost:11434
          LLM_MODEL: deepseek-coder:1.3b

      - name: Upload review
        uses: actions/upload-artifact@v3
        with:
          name: code-review
          path: review.json
```

### GitLab CI

```yaml
code-review:
  image: node:20
  services:
    - name: ollama/ollama:latest
      alias: ollama
  variables:
    LLM_ENDPOINT: http://ollama:11434
    LLM_MODEL: deepseek-coder:1.3b
  before_script:
    - npm install -g pr-review-cli
    - |
      until curl -f http://ollama:11434/api/tags; do
        sleep 1
      done
    - curl http://ollama:11434/api/pull -d '{"name": "deepseek-coder:1.3b"}'
  script:
    - pr-review compare $CI_MERGE_REQUEST_SOURCE_BRANCH_NAME $CI_MERGE_REQUEST_TARGET_BRANCH_NAME
        --format json
        --output review.json
        --exit-code
  artifacts:
    paths:
      - review.json
```

## LLM Provider Setup

### Ollama

**Installation:**

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Available Models:**

- `deepseek-coder:6.7b` (Recommended for code review)
- `deepseek-coder:1.3b` (Faster, smaller)
- `codellama:7b` (Alternative)
- `llama3:8b` (General purpose)

**Configuration:**

```yaml
llm:
  endpoint: 'http://localhost:11434'
  provider: 'ollama'
  model: 'deepseek-coder:6.7b'
```

### vLLM

**Docker:**

```bash
docker run --gpus all -p 8000:8000 vllm/vllm-openai:latest \
  --model deepseek-ai/deepseek-coder-6.7b-instruct
```

**Configuration:**

```yaml
llm:
  endpoint: 'http://localhost:8000'
  provider: 'vllm'
  model: 'deepseek-coder-6.7b-instruct'
```

### llama.cpp Server

**Docker:**

```bash
docker run -p 8080:8080 ghcr.io/ggerganov/llama.cpp:server \
  -m /models/deepseek-coder-6.7b-instruct-q4_k_m.gguf \
  --host 0.0.0.0 --port 8080
```

**Configuration:**

```yaml
llm:
  endpoint: 'http://localhost:8080'
  provider: 'llamacpp'
  model: 'deepseek-coder-6.7b-instruct'
```

### OpenAI-Compatible (LM Studio, LocalAI, etc.)

**Configuration:**

```yaml
llm:
  endpoint: 'http://localhost:1234/v1'
  provider: 'openai-compatible'
  model: 'deepseek-coder'
  apiKey: '' # Optional
```

## Security

### Network Isolation

The tool enforces strict network security:

- ✅ Only allows connections to localhost (127.0.0.1, ::1)
- ✅ Validates all endpoints before making requests
- ✅ Blocks any attempt to connect to external hosts
- ✅ Logs all connection attempts for audit

### Data Privacy

- ✅ All code analysis happens locally
- ✅ No telemetry or analytics
- ✅ No external API calls
- ✅ All data remains on your machine

### Docker Security

- ✅ Runs as non-root user (UID 1001)
- ✅ Minimal Alpine base image
- ✅ Network isolation in docker-compose
- ✅ No outbound connections

## Troubleshooting

### LLM Provider Not Available

**Error:** `LLM provider is not available`

**Solution:**

1. Ensure your LLM server is running:

   ```bash
   # For Ollama
   ollama serve

   # Check health
   curl http://localhost:11434/api/tags
   ```

2. Verify endpoint in configuration:

   ```bash
   # When running from source
   node dist/cli/index.js config get llm.endpoint

   # When installed globally
   pr-review config get llm.endpoint
   ```

3. Check network connectivity:
   ```bash
   curl http://localhost:11434/api/tags
   ```

### Network Security Error

**Error:** `SECURITY VIOLATION: Attempted to connect to non-local endpoint`

**Solution:**

- Ensure endpoint is localhost only
- Check `network.allowedHosts` in config
- Verify `NETWORK_STRICT_MODE` is not blocking valid localhost connections

### Timeout Errors

**Error:** `Request timeout after 60000ms`

**Solution:**

1. Increase timeout:

   ```bash
   # When running from source
   node dist/cli/index.js compare feature main --timeout 120

   # When installed globally
   pr-review compare feature main --timeout 120
   ```

2. Or in config:
   ```yaml
   llm:
     timeout: 120000 # 2 minutes
   ```

### No Differences Found

**Error:** `No differences found between branches`

**Solution:**

- Verify branch names are correct
- Ensure branches have commits
- Check if branches are identical

## Architecture

```
pr-review-cli/
├── src/
│   ├── cli/              # CLI interface
│   ├── core/
│   │   ├── git/         # Git operations
│   │   ├── llm/         # LLM providers
│   │   ├── review/      # Review engine
│   │   └── storage/      # Configuration
│   ├── formatters/      # Output formatters
│   ├── types/           # Type definitions
│   └── utils/           # Utilities
├── tests/               # Test suite
├── docker/              # Docker configuration
└── config/              # Default configuration
```

## Development

### Setup

```bash
# Clone repository
git clone https://github.com/your-org/pr-review-cli.git
cd pr-review-cli

# Install dependencies
npm install

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint

# Run the CLI (after building)
node dist/cli/index.js --help
```

### Testing

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `test:` Testing
- `refactor:` Code refactoring
- `security:` Security improvements

## License

MIT License - see LICENSE file for details

## Support

- 📖 [Documentation](https://github.com/your-org/pr-review-cli/wiki)
- 🐛 [Issue Tracker](https://github.com/your-org/pr-review-cli/issues)
- 💬 [Discussions](https://github.com/your-org/pr-review-cli/discussions)

## Acknowledgments

- Built with TypeScript and Node.js
- Uses [Ollama](https://ollama.com/), [vLLM](https://github.com/vllm-project/vllm), and [llama.cpp](https://github.com/ggerganov/llama.cpp) for LLM inference
- Inspired by offline-first development practices
