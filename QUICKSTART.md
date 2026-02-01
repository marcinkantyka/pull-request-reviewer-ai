# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- Git installed
- A local LLM server running (Ollama recommended)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

## Step 3: Set Up Local LLM (Ollama)

### Install Ollama

```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Or download from https://ollama.com
```

### Start Ollama and Pull a Model

```bash
# Start Ollama server (if not already running)
ollama serve

# In another terminal, pull a code review model
ollama pull qwen2.5-coder:7b

# Or use a smaller/faster model
ollama pull deepseek-coder:1.3b
```

### Verify Ollama is Running

```bash
curl http://localhost:11434/api/tags
```

You should see a JSON response with available models.

## Step 4: Configure (Optional)

Create a config file or use environment variables:

```bash
# Option 1: Initialize default config
npm run build
node dist/cli/index.js config init

# Option 2: Use environment variables
export LLM_ENDPOINT=http://localhost:11434
export LLM_MODEL=qwen2.5-coder:7b
export LLM_PROVIDER=ollama
```

## Step 5: Run Your First Review

### Option A: Using npm scripts (after linking)

```bash
# Link the package locally
npm link

# Now you can use pr-review command
pr-review review --base main
```

### Option B: Using node directly

```bash
# Review current branch against main
node dist/cli/index.js review --base main

# Compare two branches
node dist/cli/index.js compare feature-branch main

# With options
node dist/cli/index.js compare feature-branch main \
  --format json \
  --output review.json \
  --verbose
```

### Option C: Using npm run (add to package.json scripts)

Add to `package.json` scripts:

```json
"start": "node dist/cli/index.js"
```

Then run:

```bash
npm start review --base main
```

## Example Workflow

1. **Create a test repository:**

```bash
mkdir test-repo && cd test-repo
git init
echo "console.log('hello');" > test.js
git add test.js
git commit -m "Initial commit"
git checkout -b feature/test
echo "console.log('hello world');" > test.js
git add test.js
git commit -m "Update test"
```

2. **Run review:**

```bash
cd /path/to/pr-reviewer
node dist/cli/index.js compare feature/test main --repo-path /path/to/test-repo
```

## Troubleshooting

### "LLM provider is not available"

- Ensure Ollama is running: `ollama serve`
- Check endpoint: `curl http://localhost:11434/api/tags`
- Verify model is pulled: `ollama list`

### "Command not found: pr-review"

- Use `node dist/cli/index.js` instead
- Or run `npm link` to install globally

### Build errors

- Run `npm install` first
- Check Node.js version: `node --version` (needs 18+)

### TypeScript errors

- Run `npm run typecheck` to see errors
- Run `npm run lint` to check code quality

## Development Mode

For development with auto-rebuild:

```bash
# Terminal 1: Watch mode
npm run dev

# Terminal 2: Run tests
npm run test:watch
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [examples/basic-usage.sh](examples/basic-usage.sh) for more examples
- See [examples/ci-integration.yml](examples/ci-integration.yml) for CI/CD setup
