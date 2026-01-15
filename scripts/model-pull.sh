#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

MODEL_NAME=${MODEL_NAME:-qwen2.5-coder:7b}

COMPOSE_FILE="$PROJECT_DIR/compose.yaml"
if [ ! -f "$COMPOSE_FILE" ]; then
    COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"
fi

DOCKER_COMPOSE_CMD="$SCRIPT_DIR/docker-compose-wrapper.sh"

"$DOCKER_COMPOSE_CMD" -f "$COMPOSE_FILE" exec ollama ollama pull "$MODEL_NAME"
