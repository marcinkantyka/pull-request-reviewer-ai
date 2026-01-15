#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ -n "$1" ]; then
    REPO_PATH="$1"
    if [ ! -d "$REPO_PATH" ]; then
        echo -e "${RED}Error: Directory not found: $REPO_PATH${NC}"
        exit 1
    fi
else
    REPO_PATH=$(pwd)
fi

if [ ! -d "$REPO_PATH/.git" ]; then
    echo -e "${RED}Error: Not a git repository: $REPO_PATH${NC}"
    echo "Usage: $0 [repository-path]"
    echo "Run this script from a git repository, or provide the path as an argument"
    exit 1
fi

echo "Fetching remote branches..."
cd "$REPO_PATH"
git fetch origin 2>/dev/null || echo "Warning: Could not fetch from origin (continuing with cached branches)"
cd - > /dev/null

echo "Local PR Reviewer"
echo "================"
echo ""
echo "Repository: $REPO_PATH"
echo "Security: Network isolated - no external connections"
echo ""

if [ ! -f "$PROJECT_DIR/compose.yaml" ] && [ ! -f "$PROJECT_DIR/docker-compose.yml" ]; then
    echo -e "${RED}Error: compose.yaml or docker-compose.yml not found${NC}"
    echo "Make sure you're running this from the pr-reviewer directory"
    exit 1
fi

if [ -f "$PROJECT_DIR/.env" ]; then
    export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)
fi

COMPOSE_FILE="$PROJECT_DIR/compose.yaml"
if [ ! -f "$COMPOSE_FILE" ]; then
    COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"
fi

DOCKER_COMPOSE_CMD="$SCRIPT_DIR/docker-compose-wrapper.sh"

if ! "$DOCKER_COMPOSE_CMD" -f "$COMPOSE_FILE" ps | grep ollama | grep -q "Up"; then
    echo "Starting Ollama service..."
    "$DOCKER_COMPOSE_CMD" -f "$COMPOSE_FILE" up -d ollama
    echo "Waiting for Ollama to initialize..."
    sleep 5
fi

echo "Checking Ollama status..."
RETRIES=0
MAX_RETRIES=10
while [ $RETRIES -lt $MAX_RETRIES ]; do
    if "$DOCKER_COMPOSE_CMD" -f "$COMPOSE_FILE" exec -T ollama ollama list &> /dev/null; then
        echo -e "${GREEN}Ollama is ready${NC}"
        break
    fi
    echo "Waiting... ($((RETRIES+1))/$MAX_RETRIES)"
    sleep 2
    RETRIES=$((RETRIES+1))
done

if [ $RETRIES -eq $MAX_RETRIES ]; then
    echo -e "${RED}Ollama is not responding${NC}"
    echo "Check logs: $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE logs ollama"
    exit 1
fi

MODEL_NAME=${MODEL_NAME:-qwen2.5-coder:7b}
echo "Checking for model: $MODEL_NAME..."
if ! "$DOCKER_COMPOSE_CMD" -f "$COMPOSE_FILE" exec -T ollama ollama list 2>/dev/null | grep -q "$MODEL_NAME"; then
    echo -e "${YELLOW}Model not found. Pulling model...${NC}"
    echo "This may take several minutes (~4.7GB download)"
    "$DOCKER_COMPOSE_CMD" -f "$COMPOSE_FILE" exec -T ollama ollama pull "$MODEL_NAME"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Model pulled successfully${NC}"
    else
        echo -e "${RED}Failed to pull model${NC}"
        echo "You can pull it manually with:"
        echo "$DOCKER_COMPOSE_CMD -f $COMPOSE_FILE exec ollama ollama pull $MODEL_NAME"
        exit 1
    fi
else
    echo -e "${GREEN}Model is available${NC}"
fi

echo ""

VOLUME_ARGS=(
    -e REPO_PATH=/repo
    -e REVIEWS_PATH=/reviews
    -e MODEL_NAME="$MODEL_NAME"
    -e BASE_BRANCH="${BASE_BRANCH:-main}"
    -v "$REPO_PATH:/repo:ro"
    -v "$PROJECT_DIR/reviews:/reviews"
)

if [ -f "$HOME/.gitconfig" ]; then
    VOLUME_ARGS+=(-v "$HOME/.gitconfig:/root/.gitconfig:ro")
fi

if [ -d "$HOME/.ssh" ]; then
    VOLUME_ARGS+=(-v "$HOME/.ssh:/root/.ssh:ro")
fi

"$DOCKER_COMPOSE_CMD" -f "$COMPOSE_FILE" run --rm "${VOLUME_ARGS[@]}" pr-reviewer

echo ""
echo -e "${GREEN}Review complete!${NC}"
echo "Check the reviews/ folder for the full report"
echo ""