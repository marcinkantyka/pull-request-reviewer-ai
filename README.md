# Local PR Reviewer

AI-powered code review that runs 100% on your MacBook M3. Zero data leakage. Optimized for JavaScript/TypeScript.

## Features

- **100% Private** - Code never leaves your machine
- **Network Isolated** - PR reviewer container has zero external access
- **JS/TS Optimized** - Qwen2.5-Coder-7B trained on TypeScript
- **M3 Optimized** - Perfect for 16GB MacBook M3
- **Fast Reviews** - ~30 seconds per PR
- **Zero Cost** - No API fees, runs locally

## Quick Start

```bash
# 1. Clone this repo
git clone <this-repo-url> pr-reviewer
cd pr-reviewer

# 2. Run setup (one-time, ~5 minutes)
./scripts/setup.sh

# 3. Review any PR (run from the repository you want to review)
cd /path/to/your/repo
/path/to/pr-reviewer/scripts/review.sh

# Or pass the repository path as an argument
/path/to/pr-reviewer/scripts/review.sh /path/to/your/repo
```

That's it! Select a PR from the list and get AI-powered feedback.

## Prerequisites

- **Hardware**: MacBook M3 with 16GB RAM
- **Software**: 
  - Docker Desktop for Mac
  - Git (usually pre-installed on macOS)
  - 7GB free disk space

## Installation

### Step 1: Install Dependencies

```bash
# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop

# Git is usually pre-installed on macOS
# Verify: git --version
```

### Step 2: Setup PR Reviewer

```bash
# Clone this repository
git clone <this-repo> pr-reviewer
cd pr-reviewer

# Make scripts executable
chmod +x scripts/*.sh

# Run setup script
./scripts/setup.sh
```

The setup script will:
1. Check Docker is running
2. Build Docker containers
3. Download Qwen2.5-Coder-7B model (~4.7GB)
4. Verify network isolation
5. Run test review

## Usage

### Review a Branch

Run the review script from the repository you want to review:

```bash
# Option 1: Run from the repository directory
cd /path/to/your/repo
/path/to/pr-reviewer/scripts/review.sh

# Option 2: Pass repository path as argument
/path/to/pr-reviewer/scripts/review.sh /path/to/your/repo
```

This will:
1. Fetch all remote branches
2. Show you a list of branches (excluding the base branch)
3. Let you select which branch to review
4. Compare the branch against the base branch (via git)
5. Analyze the diff with local AI
6. Save review to `reviews/` folder

### Example Output

```
Local PR Reviewer
==================

Security: All code analysis happens locally
Network: Isolated - no external connections
Model: qwen2.5-coder:7b

Connecting to Ollama...
Connected to Ollama

Checking for model: qwen2.5-coder:7b...
Model is ready

Fetching branches...
Found 2 branch(es) to review

Available Branches:

1. Add user authentication
   Author: johndoe | Branch: feature/auth -> main

2. Fix memory leak in cache
   Author: janedoe | Branch: bugfix/cache-leak -> main

Select PR number (or 0 to cancel): 1

Selected: Add user authentication

Files changed: 5
  src/auth/login.ts
  src/auth/types.ts
  src/middleware/auth.ts
  tests/auth.test.ts
  package.json

Changes:
  Files: 5
  Insertions: +234
  Deletions: -12

Diff size: 12.3 KB

Proceed with AI review? (y/n): y

Analyzing code with Qwen2.5-Coder...

Analysis completed in 28.5s

================================================================================
REVIEW RESULTS
================================================================================

[AI-generated review content]

================================================================================

Review saved to: /reviews/review-PR1-2026-01-15T10-30-45.md
```

## Project Structure

```
pr-reviewer/
├── scripts/
│   ├── setup.sh              # Initial setup
│   ├── review.sh             # Run reviews
│   └── verify-isolation.sh   # Security check
├── src/
│   ├── index.ts              # Main entry point
│   ├── reviewer.ts           # Review logic
│   ├── github.ts             # GitHub integration
│   └── types.ts              # Type definitions
├── reviews/                  # Generated reviews
├── compose.yaml              # Container config
├── Dockerfile                # Container image
└── README.md                 # This file
```

## Security Guarantees

### How We Ensure Privacy

1. **Docker Network Isolation**
   - PR reviewer container is on an isolated network (no internet access)
   - Ollama container has internet access only for pulling models
   - Once models are downloaded, Ollama can operate without internet

2. **No Cloud APIs**
   - Ollama runs locally
   - Models are downloaded once, used offline
   - No telemetry or analytics

3. **Read-Only Repo Access**
   - Repository is mounted as read-only
   - No modifications to your code

### Verify It Yourself

```bash
# Test network isolation
./scripts/verify-isolation.sh

# Monitor network traffic (should see ZERO external calls from pr-reviewer)
sudo tcpdump -i any -n 'not host 127.0.0.1' &
./scripts/review.sh
# Stop tcpdump - you'll see no packets to internet from pr-reviewer container
```

## Configuration

Edit `.env` file:

```bash
# Model selection (7B recommended for 16GB RAM)
MODEL_NAME=qwen2.5-coder:7b

# Base branch for diffs
BASE_BRANCH=main
```

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **RAM** | 16GB | 32GB |
| **Storage** | 7GB free | 20GB free |
| **CPU** | M3 | M3 Pro/Max |
| **macOS** | 13.0+ | 14.0+ |

### Performance on M3 16GB

- **Review Speed**: 20-40 seconds per PR
- **Memory Usage**: ~12GB peak
- **Model Load Time**: ~5 seconds
- **Disk Usage**: ~7GB total

## Troubleshooting

### "Cannot connect to Ollama"

```bash
# Check if Ollama container is running
docker-compose ps

# Start it manually
docker-compose up -d ollama

# Check logs
docker-compose logs ollama
```

### "Model not found"

The script will automatically pull the model if it's not found. If that fails:

```bash
# Pull model manually
docker-compose exec ollama ollama pull qwen2.5-coder:7b

# List available models
docker-compose exec ollama ollama list
```

### "Not a git repository"

Make sure you're running the review script from a git repository, or pass the repository path as an argument:

```bash
./scripts/review.sh /path/to/your/repo
```

### "Permission denied"

```bash
# Make scripts executable
chmod +x scripts/*.sh
```

See [docs/# Troubleshooting Guide](docs/# Troubleshooting Guide) for more.

## Documentation

- [Security.md](docs/Security.md) - Security verification guide
- [Troubleshooting Guide](docs/# Troubleshooting Guide) - Common issues

## Updates

```bash
# Update to latest version
git pull

# Rebuild containers
docker-compose build

# Update model
docker-compose exec ollama ollama pull qwen2.5-coder:7b
```

## Contributing

PRs welcome! This tool reviews code—it should be well-reviewed itself.

## License

MIT License

## Acknowledgments

- **Qwen Team** - For the excellent Qwen2.5-Coder models
- **Ollama** - For making local LLMs accessible

## Why This Exists

Most PR review tools send your code to external APIs. For proprietary or sensitive codebases, that's a non-starter. This tool keeps everything local while still providing AI-powered insights.
