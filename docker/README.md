# Docker Setup - Automated & Secure

This directory contains Docker configurations for running PR Review CLI with complete network isolation.

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

## Files

- `docker-compose.yml` - Main secure configuration (internal network)
- `docker-compose.setup.yml` - Temporary setup file (allows internet for model download)
- `start.sh` - Automated startup script (use this one)
- `setup-models.sh` - Model download script (called automatically)

## Manual Usage

### Standard startup (after initial setup):
```bash
docker-compose up
```

### Download models manually (if start.sh fails):
```bash
./setup-models.sh
```

### View logs:
```bash
docker-compose logs -f ollama
docker-compose logs -f pr-review
```

### Stop services:
```bash
docker-compose down
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
- The `pr-review` container has additional security: `dns: []` and dropped capabilities

## Troubleshooting

**"Model not found" errors:**
- Run `./setup-models.sh` to download models

**"Cannot connect to ollama":**
- Check if ollama is running: `docker-compose ps`
- Check logs: `docker-compose logs ollama`

**Port conflicts:**
- Change port mapping in `docker-compose.yml`: `'11434:11434'` → `'11435:11434'`
