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
# If you ran npm link, use:
pr-review review --base main

# Otherwise, use:
node dist/cli/index.js review --base main
```

That's it! The tool will analyze your changes and show the results.

## Configuration (optional)

The tool works with defaults, but you can customize it:

```bash
# Create a config file
node dist/cli/index.js config init

# Or use environment variables
export LLM_ENDPOINT=http://localhost:11434
export LLM_MODEL=deepseek-coder:6.7b
```

## Troubleshooting

**"LLM provider is not available"**

Make sure Ollama is running:

```bash
ollama serve
curl http://localhost:11434/api/tags
```

**"Command not found: pr-review"**

Use `node dist/cli/index.js` instead, or run `npm link` to install globally.

## Next steps

- See [README.md](README.md) for full documentation
- Check [examples/](examples/) for more usage examples
