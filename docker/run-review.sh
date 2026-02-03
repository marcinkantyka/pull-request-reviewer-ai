#!/bin/bash
# Universal wrapper script for running PR Review CLI in Docker
# This script handles mounting any git repository dynamically

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

# Detect docker-compose command
if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    echo "Error: docker-compose not found"
    exit 1
fi

cd "$SCRIPT_DIR"

# Get version from package.json (single source of truth)
if command -v node >/dev/null 2>&1; then
    VERSION=$(node -p "require('../package.json').version" 2>/dev/null || echo "1.0.0")
elif command -v jq >/dev/null 2>&1; then
    VERSION=$(jq -r '.version' ../package.json 2>/dev/null || echo "1.0.0")
else
    VERSION="1.0.0"
fi

# Get network name from docker-compose
PROJECT_NAME=$($COMPOSE_CMD -f "$COMPOSE_FILE" config --project-name 2>/dev/null || echo "docker")
NETWORK_NAME="${PROJECT_NAME}_pr-review-network"

# Check if first argument is a path (starts with / or . or contains /)
if [ "$#" -gt 0 ] && ([ "${1#/}" != "$1" ] || [ "${1#.}" != "$1" ] || [ "${1#*/*}" != "$1" ]); then
    REPO_PATH="$1"
    shift
else
    REPO_PATH="$(pwd)"
fi

REPO_PATH=$(cd "$REPO_PATH" 2>/dev/null && pwd || echo "$REPO_PATH")

if [ ! -d "$REPO_PATH/.git" ]; then
    echo "Error: $REPO_PATH is not a git repository"
    echo "Usage: $0 [repo-path] <command> [options]"
    echo "Example: $0 . review --base main"
    echo "Example: $0 /path/to/repo compare feature main"
    exit 1
fi

if [ "$#" -eq 0 ]; then
    echo "Error: No command provided"
    echo "Usage: $0 [repo-path] <command> [options]"
    echo "Example: $0 . review --base main"
    exit 1
fi

# Ensure image is built
echo "Building PR Review CLI image (if needed)..."
$COMPOSE_CMD -f "$COMPOSE_FILE" build pr-review >/dev/null 2>&1 || true

# Check if network exists
if ! docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
    echo "Error: Network $NETWORK_NAME not found. Please start Ollama first:"
    echo "  cd $SCRIPT_DIR && docker-compose up -d"
    exit 1
fi

echo "Running PR Review CLI for repository: $REPO_PATH"
echo "Command: $*"
echo ""

docker run --rm -it \
    --network "$NETWORK_NAME" \
    -v "$REPO_PATH:/workspace:ro" \
    -v "$SCRIPT_DIR/output:/output" \
    -e LLM_ENDPOINT=http://ollama:11434 \
    -e LLM_MODEL=deepseek-coder:6.7b \
    -e NETWORK_ALLOWED_HOSTS=ollama,localhost,127.0.0.1,::1 \
    -e NETWORK_STRICT_MODE=true \
    -w /workspace \
    pr-reviewer-pr-review:${VERSION} \
    node dist/cli/index.js "$@"
