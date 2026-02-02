#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
SETUP_SCRIPT="$SCRIPT_DIR/setup-models.sh"

if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    echo "Error: docker-compose not found. Please install Docker Compose."
    exit 1
fi

echo "PR Review CLI - Automated Startup"
echo "=================================="
echo ""

if ! docker volume inspect pr-reviewer_ollama-data >/dev/null 2>&1 || \
   ! docker run --rm \
     -v pr-reviewer_ollama-data:/root/.ollama \
     ollama/ollama:latest \
     ollama list 2>/dev/null | grep -q "deepseek-coder:6.7b"; then
    echo "Model not found - running automatic setup..."
    echo ""
    bash "$SETUP_SCRIPT"
    echo ""
fi

echo "Starting services with secure internal network..."
echo "(No internet access - all traffic blocked)"
echo ""

$COMPOSE_CMD -f "$COMPOSE_FILE" up "$@"
