# Docker Setup - Automated & Secure

This directory contains Docker configurations for running PR Review CLI with complete network isolation.

## Requirements

- Docker Engine
- Docker Compose (`docker compose` or `docker-compose`)

## Quick Start

To get started, just run:

```bash
cd docker
./start.sh
```

The script handles everything automatically:

1. Checks if models are already downloaded
2. Downloads models if needed (first time only)
3. Starts services with secure internal network (no internet access)
4. Blocks all outbound traffic for security

## Security Features

- **Complete Network Isolation**: `internal: true` blocks all internet access
- **No Outbound Traffic**: LLM containers cannot reach external services
- **No Data Transmission**: Your code never leaves your machine
- **Automatic Setup**: Models downloaded securely before switching to isolated mode

## Architecture

The Docker setup uses a **two-container approach**:

1. **Ollama service** (always running): Provides the LLM service in an isolated network
2. **PR Review CLI** (on-demand): Runs as needed via `run-review.sh` script, mounting any git repository dynamically

This approach is universal - you can review any git repository without modifying docker-compose.yml.

## Files

- `docker-compose.yml` - Main secure configuration (internal network, Ollama only)
- `docker-compose.setup.yml` - Temporary setup file (allows internet for model download)
- `start.sh` - Automated startup script (use this one)
- `setup-models.sh` - Model download script (called automatically)
- `run-review.sh` - Universal wrapper script for running reviews on any repository

## Manual Usage

### Standard startup (after initial setup)

```bash
docker-compose up -d
# or
docker compose up -d
```

This starts only the Ollama service. The CLI tool runs on-demand using the wrapper script.

If you want to run the `pr-review` service via docker-compose, set `REPO_PATH` to the target git repo:

```bash
REPO_PATH=/path/to/your/repo docker-compose up pr-review
# or
REPO_PATH=/path/to/your/repo docker compose up pr-review
```

This mounts the repo read-only at `/workspace` and writes outputs to `docker/output`.

### Run review commands (recommended)

Use the universal wrapper script that works with any git repository:

```bash
# From any git repository directory:
cd /path/to/your/repo
/path/to/pull-request-reviewer-ai/docker/run-review.sh . review --base main

# Or specify the repo path explicitly:
/path/to/pull-request-reviewer-ai/docker/run-review.sh /path/to/your/repo compare feature-branch main

# With custom options:
/path/to/pull-request-reviewer-ai/docker/run-review.sh . compare feature-branch main --format json --output /output/review.json

# Review current directory (default):
/path/to/pull-request-reviewer-ai/docker/run-review.sh review --base main
```

Outputs are written to `docker/output` (mounted as `/output`).

### Configuration (Docker)

You can pass configuration to the container via:
- Mounting a config file (`/config/config.yml`) and setting `--config /config/config.yml`
- Environment variables (`LLM_*`, `NETWORK_*`, `REVIEW_*`)

Recommended deterministic + offline-safe settings:
- `LLM_TEMPERATURE=0`
- `LLM_SEED=42`
- `LLM_TOP_P=1`
- `NETWORK_ALLOWED_HOSTS=ollama,localhost,127.0.0.1,::1`
- Set `review.changeSummaryMode: deterministic` in your config file

### Model selection

By default the scripts use `deepseek-coder:6.7b`. To change the model:

- Download it in Ollama (`ollama pull <model>`)
- Set `LLM_MODEL=<model>` when running the container or in your config

Example (manual run):

```bash
VERSION=$(node -p "require('../package.json').version")
docker run --rm -it \
  --network pr-reviewer_pr-review-network \
  -v /path/to/your/repo:/workspace:ro \
  -v $(pwd)/output:/output \
  -e LLM_ENDPOINT=http://ollama:11434 \
  -e LLM_MODEL=deepseek-coder:6.7b \
  -e LLM_TEMPERATURE=0 \
  -e LLM_SEED=42 \
  -e NETWORK_ALLOWED_HOSTS=ollama,localhost,127.0.0.1,::1 \
  -w /workspace \
  pr-reviewer-pr-review:${VERSION} \
  review --base main --format json --output /output/review.json
```

### Alternative: Manual docker run

If you prefer to use docker run directly:

```bash
# Build the image first (one time)
docker-compose build pr-review
# or
docker compose build pr-review

# Capture the version tag used by the image
VERSION=$(node -p "require('../package.json').version")

# Find the compose network name (varies by directory)
NETWORK_NAME="$(docker compose -f docker-compose.yml config --project-name)_pr-review-network"
# If you use docker-compose v1, replace `docker compose` with `docker-compose`.

# Run review for any repository
docker run --rm -it \
    --network "$NETWORK_NAME" \
    -v /path/to/your/repo:/workspace:ro \
    -v $(pwd)/output:/output \
    -e LLM_ENDPOINT=http://ollama:11434 \
    -e LLM_MODEL=deepseek-coder:6.7b \
    -e NETWORK_ALLOWED_HOSTS=ollama,localhost,127.0.0.1,::1 \
    -w /workspace \
    pr-reviewer-pr-review:${VERSION} \
    compare feature-branch main
```

### Download models manually (if start.sh fails):

```bash
./setup-models.sh
```

### View logs:

```bash
docker-compose logs -f ollama
docker-compose logs -f pr-review
# or
docker compose logs -f ollama
docker compose logs -f pr-review
```

### Stop services:

```bash
docker-compose down
# or
docker compose down
```

## How Security Works

1. **First Run**: `start.sh` detects missing models
2. **Setup Phase**: Temporarily uses `docker-compose.setup.yml` (internet allowed)
3. **Model Download**: Downloads model to persistent volume
4. **Secure Mode**: Switches to `docker-compose.yml` with `internal: true`
5. **Operation**: All containers run with zero internet access

The model is stored in a Docker volume (`ollama-data`), so it persists across restarts. After the first download, all subsequent runs use the secure internal network immediately.

## Important Notes

- Models are downloaded once and stored in a Docker volume
- After initial setup, the network is always internal (no internet)
- If you need to update models, run `./setup-models.sh` again
- **Version Management**: Image version is automatically read from `package.json` - see [VERSION.md](VERSION.md) for details

## Troubleshooting

**"Model not found" errors:**

- Run `./setup-models.sh` to download models

**"Cannot connect to ollama":**

- Check if ollama is running: `docker-compose ps`
- Check logs: `docker-compose logs ollama`

**Port conflicts:**

- Change port mapping in `docker-compose.yml`: `'11434:11434'` → `'11435:11434'`
