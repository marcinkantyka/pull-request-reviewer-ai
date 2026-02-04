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

cd "$SCRIPT_DIR"

# Get version from package.json (single source of truth)
if command -v node >/dev/null 2>&1; then
    VERSION=$(node -p "require('../package.json').version" 2>/dev/null || echo "1.1.0")
elif command -v jq >/dev/null 2>&1; then
    VERSION=$(jq -r '.version' ../package.json 2>/dev/null || echo "1.1.0")
else
    VERSION="1.1.0"
fi

export PR_REVIEW_VERSION="$VERSION"

VOLUME_NAME=$($COMPOSE_CMD -f "$COMPOSE_FILE" config --volumes | head -1)
PROJECT_NAME=$($COMPOSE_CMD -f "$COMPOSE_FILE" config --project-name 2>/dev/null || echo "docker")
FULL_VOLUME_NAME="${PROJECT_NAME}_${VOLUME_NAME}"

echo "PR Review CLI - Automated Startup"
echo "=================================="
echo ""

if ! docker volume inspect "$FULL_VOLUME_NAME" >/dev/null 2>&1; then
    MODEL_EXISTS=false
else
    TEMP_PORT=$((11435 + RANDOM % 1000))
    TEMP_CONTAINER=$(docker run -d --rm \
        -v "$FULL_VOLUME_NAME:/root/.ollama" \
        -p "$TEMP_PORT:11434" \
        ollama/ollama:0.4.0 serve 2>/dev/null)
    if [ -n "$TEMP_CONTAINER" ]; then
        sleep 2
        if curl -s "http://localhost:$TEMP_PORT/api/tags" 2>/dev/null | grep -q "deepseek-coder:6.7b"; then
            MODEL_EXISTS=true
        else
            MODEL_EXISTS=false
        fi
        docker stop "$TEMP_CONTAINER" >/dev/null 2>&1
    else
        MODEL_EXISTS=false
    fi
fi

if [ "$MODEL_EXISTS" = false ]; then
    echo "Model not found - running automatic setup..."
    echo ""
    bash "$SETUP_SCRIPT"
    echo ""
fi

echo "Building PR Review CLI image (version: $VERSION)..."
$COMPOSE_CMD -f "$COMPOSE_FILE" build pr-review

echo ""
echo "Starting Ollama service with secure internal network..."
echo "(No internet access - all traffic blocked)"
echo ""
echo "To run reviews, use: ./run-review.sh [repo-path] <command>"
echo "Example: ./run-review.sh . review --base main"
echo ""

$COMPOSE_CMD -f "$COMPOSE_FILE" up "$@"
