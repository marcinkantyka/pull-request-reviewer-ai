#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
SETUP_FILE="$SCRIPT_DIR/docker-compose.setup.yml"

if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    echo "Error: docker-compose not found. Please install Docker Compose."
    exit 1
fi

echo "PR Review CLI - Secure Model Setup"
echo "==================================="
echo ""

if docker volume inspect pr-reviewer_ollama-data >/dev/null 2>&1; then
    echo "Checking for existing models..."
    if docker run --rm \
        -v pr-reviewer_ollama-data:/root/.ollama \
        ollama/ollama:latest \
        ollama list 2>/dev/null | grep -q "deepseek-coder:6.7b"; then
        echo "Model 'deepseek-coder:6.7b' already exists in volume"
        echo "Skipping download - ready for secure operation"
        exit 0
    fi
fi

echo "Model not found. Starting secure download process..."
echo ""

echo "Step 1/2: Downloading model (this may take several minutes)..."
$COMPOSE_CMD -f "$SETUP_FILE" up -d ollama-setup

echo "   Waiting for Ollama to start..."
timeout=60
elapsed=0
while ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; do
    if [ $elapsed -ge $timeout ]; then
        echo "Timeout waiting for Ollama to start"
        $COMPOSE_CMD -f "$SETUP_FILE" down
        exit 1
    fi
    sleep 2
    elapsed=$((elapsed + 2))
    echo -n "."
done
echo ""
echo "   Ollama is ready"

echo "   Downloading model (this may take 5-15 minutes depending on your connection)..."
$COMPOSE_CMD -f "$SETUP_FILE" logs -f ollama-setup &
LOGS_PID=$!

wait_time=0
max_wait=1800  # 30 minutes max
while docker ps | grep -q pr-review-ollama-setup; do
    sleep 5
    wait_time=$((wait_time + 5))
    if [ $wait_time -ge $max_wait ]; then
        echo ""
        echo "Timeout waiting for model download"
        kill $LOGS_PID 2>/dev/null || true
        $COMPOSE_CMD -f "$SETUP_FILE" down
        exit 1
    fi
done

kill $LOGS_PID 2>/dev/null || true

if docker run --rm \
    -v pr-reviewer_ollama-data:/root/.ollama \
    ollama/ollama:latest \
    ollama list 2>/dev/null | grep -q "deepseek-coder:6.7b"; then
    echo "   Model downloaded successfully"
else
    echo "   Model download failed"
    $COMPOSE_CMD -f "$SETUP_FILE" down
    exit 1
fi

echo ""
echo "Step 2/2: Switching to secure internal network..."
$COMPOSE_CMD -f "$SETUP_FILE" down

echo ""
echo "Setup complete! Model is ready."
echo "You can now run 'docker-compose up' with secure internal network (no internet access)"
echo ""
