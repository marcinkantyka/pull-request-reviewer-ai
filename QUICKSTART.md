# Quick Start Guide

Get up and running in a few minutes.

## Prerequisites

- Node.js 18+
- Git
- A local LLM server (Ollama recommended)

## Setup

### 1. Install and build

```bash
git clone https://github.com/marcinkantyka/pull-request-reviewer-ai.git
cd pull-request-reviewer-ai
npm install
npm run build
```

### 2. Set up Ollama

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model (this takes a few minutes)
ollama pull deepseek-coder:6.7b

# Verify it's working
curl http://localhost:11434/api/tags
```

### 3. Run your first review

```bash
# If installed globally:
pr-review review --base main

# Or run from source:
node dist/cli/index.js review --base main
```

That's all you need. The tool will analyze your changes and show you the results.

Optional: start the local UI (still offline/local-only):

```bash
pr-review --server
```

Default port is `47831`. If that port is busy, the server falls back to a random free port. You can force a random port with `--port 0`.

### UI Quickstart

1. Run `pr-review --server` and open the URL printed in the console.
2. Pick your repository path (or use the current directory).
3. Choose a base branch (default is `main`).
4. (Optional) Load models and pick an LLM model.
5. Click **Run Review** to generate results.

Tip: Use **Advanced** to set project-specific context and other overrides for a single run.

## Configuration (optional)

The tool works with defaults, but you can customize it:

```bash
# Create a config file (if using global install)
pr-review config init

# Or if running from source
node dist/cli/index.js config init

# Or use environment variables
export LLM_ENDPOINT=http://localhost:11434
export LLM_MODEL=deepseek-coder:6.7b
export LLM_PROVIDER=ollama
```

This creates a `pr-review.config.yml` file with all available configuration options. See [README.md](README.md) for full configuration details.
In UI mode, you can also generate the config template from the Advanced panel.

### Project Context (Recommended)

Use `review.projectContext` (or `REVIEW_PROJECT_CONTEXT`) to inject project-specific rules and reduce false positives.

Example:

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

## Troubleshooting

**LLM provider is not available**

If you see this error, make sure Ollama is actually running:

```bash
ollama serve
curl http://localhost:11434/api/tags
```

**Command not found: pr-review**

If the command isn't found, use `node dist/cli/index.js` instead, or run `npm link` to install it globally.

## Next steps

- See [README.md](README.md) for full documentation
- Check [examples/](examples/) for more usage examples
