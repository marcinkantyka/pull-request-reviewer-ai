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

cd "$SCRIPT_DIR"

VOLUME_NAME=$($COMPOSE_CMD -f "$SETUP_FILE" config --volumes | head -1)
PROJECT_NAME=$($COMPOSE_CMD -f "$SETUP_FILE" config --project-name 2>/dev/null || echo "docker")
FULL_VOLUME_NAME="${PROJECT_NAME}_${VOLUME_NAME}"

echo "PR Review CLI - Secure Model Setup"
echo "==================================="
echo ""

if docker volume inspect "$FULL_VOLUME_NAME" >/dev/null 2>&1; then
    echo "Checking for existing models..."
    TEMP_PORT=$((11435 + RANDOM % 1000))
    TEMP_CONTAINER=$(docker run -d --rm \
        -v "$FULL_VOLUME_NAME:/root/.ollama" \
        -p "$TEMP_PORT:11434" \
        ollama/ollama:0.4.0 serve 2>/dev/null)
    if [ -n "$TEMP_CONTAINER" ]; then
        sleep 3
        if curl -s "http://localhost:$TEMP_PORT/api/tags" 2>/dev/null | grep -q "deepseek-coder:6.7b"; then
            docker stop "$TEMP_CONTAINER" >/dev/null 2>&1
            echo "Model 'deepseek-coder:6.7b' already exists in volume"
            echo "Skipping download - ready for secure operation"
            exit 0
        fi
        docker stop "$TEMP_CONTAINER" >/dev/null 2>&1
    fi
fi

echo "Model not found. Starting secure download process..."
echo ""

echo "Step 1/2: Downloading model (this may take several minutes)..."
$COMPOSE_CMD -f "$SETUP_FILE" up -d ollama-setup

echo "   Waiting for Ollama to start..."
timeout=120
elapsed=0
while ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; do
    if [ $elapsed -ge $timeout ]; then
        echo ""
        echo "Timeout waiting for Ollama to start"
        echo "Container logs:"
        $COMPOSE_CMD -f "$SETUP_FILE" logs ollama-setup
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
max_wait=1800
container_exited=false

while [ $wait_time -lt $max_wait ]; do
    if ! docker ps | grep -q pr-review-ollama-setup; then
        container_exited=true
        break
    fi
    sleep 5
    wait_time=$((wait_time + 5))
done

kill $LOGS_PID 2>/dev/null || true

if [ "$container_exited" = false ]; then
    echo ""
    echo "Timeout waiting for model download (exceeded $max_wait seconds)"
    echo "This might indicate a network issue or the model is very large."
    echo "You can check the logs manually:"
    echo "  docker-compose -f docker/docker-compose.setup.yml logs ollama-setup"
    $COMPOSE_CMD -f "$SETUP_FILE" down
    exit 1
fi

sleep 3

EXIT_CODE=$(docker inspect pr-review-ollama-setup --format='{{.State.ExitCode}}' 2>/dev/null || echo "1")

if [ "$EXIT_CODE" != "0" ]; then
    echo ""
    echo "Container exited with error code: $EXIT_CODE"
    echo "Recent logs:"
    $COMPOSE_CMD -f "$SETUP_FILE" logs ollama-setup | tail -30
    echo ""
fi

echo "   Verifying model in volume ($FULL_VOLUME_NAME)..."
sleep 2

MODEL_CHECK_ATTEMPTS=0
MAX_ATTEMPTS=3
MODEL_FOUND=false

TEMP_PORT=$((11435 + RANDOM % 1000))

while [ $MODEL_CHECK_ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    TEMP_CONTAINER=$(docker run -d --rm \
        -v "$FULL_VOLUME_NAME:/root/.ollama" \
        -p "$TEMP_PORT:11434" \
        ollama/ollama:0.4.0 serve 2>/dev/null)
    
    if [ -n "$TEMP_CONTAINER" ]; then
        sleep 3
        MODEL_LIST=$(curl -s "http://localhost:$TEMP_PORT/api/tags" 2>/dev/null || echo "")
        docker stop "$TEMP_CONTAINER" >/dev/null 2>&1
        
        if echo "$MODEL_LIST" | grep -q "deepseek-coder:6.7b"; then
            MODEL_FOUND=true
            break
        fi
    fi
    
    MODEL_CHECK_ATTEMPTS=$((MODEL_CHECK_ATTEMPTS + 1))
    if [ $MODEL_CHECK_ATTEMPTS -lt $MAX_ATTEMPTS ]; then
        echo "   Attempt $MODEL_CHECK_ATTEMPTS: Model not found yet, retrying in 3 seconds..."
        sleep 3
    fi
done

if [ "$MODEL_FOUND" = true ]; then
    echo "   Model downloaded successfully"
    if [ -n "$MODEL_LIST" ]; then
        echo "   Available models:"
        echo "$MODEL_LIST" | jq -r '.models[].name' 2>/dev/null | sed 's/^/     /' || echo "$MODEL_LIST" | sed 's/^/     /'
    fi
else
    echo ""
    echo "   Model verification failed after $MAX_ATTEMPTS attempts"
    echo "   Container exit code: $EXIT_CODE"
    echo "   Volume name: $FULL_VOLUME_NAME"
    echo ""
    FINAL_TEMP_PORT=$((11435 + RANDOM % 1000))
    TEMP_CONTAINER=$(docker run -d --rm \
        -v "$FULL_VOLUME_NAME:/root/.ollama" \
        -p "$FINAL_TEMP_PORT:11434" \
        ollama/ollama:0.4.0 serve 2>/dev/null)
    if [ -n "$TEMP_CONTAINER" ]; then
        sleep 3
        FINAL_MODEL_LIST=$(curl -s "http://localhost:$FINAL_TEMP_PORT/api/tags" 2>/dev/null || echo "")
        docker stop "$TEMP_CONTAINER" >/dev/null 2>&1
        if [ -n "$FINAL_MODEL_LIST" ]; then
            echo "   Models found in volume:"
            echo "$FINAL_MODEL_LIST" | jq -r '.models[].name' 2>/dev/null | sed 's/^/     /' || echo "$FINAL_MODEL_LIST" | sed 's/^/     /'
        else
            echo "   No models found in volume"
        fi
    else
        echo "   Could not check volume contents"
    fi
    echo ""
    if [ "$EXIT_CODE" = "0" ]; then
        echo "   Note: Container exited successfully, but model not found in volume."
        echo "   This might indicate the model was downloaded to a different location."
    fi
    echo ""
    echo "   Troubleshooting:"
    echo "   1. Check full logs: $COMPOSE_CMD -f $SETUP_FILE logs ollama-setup"
    echo "   2. Try pulling manually: docker run --rm -v $FULL_VOLUME_NAME:/root/.ollama ollama/ollama pull deepseek-coder:6.7b"
    echo "   3. Check if volume exists: docker volume inspect $FULL_VOLUME_NAME"
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
