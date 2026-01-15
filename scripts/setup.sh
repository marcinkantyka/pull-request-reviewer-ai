#!/bin/bash

set -e

echo "Local PR Reviewer Setup"
echo "======================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}Error: This script is for macOS${NC}"
    exit 1
fi

if [[ $(uname -m) != "arm64" ]]; then
    echo -e "${YELLOW}Warning: Optimized for Apple Silicon${NC}"
    echo "Running on $(uname -m)"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

TOTAL_RAM=$(sysctl -n hw.memsize | awk '{print int($1/1024/1024/1024)}')
echo "Detected RAM: ${TOTAL_RAM}GB"
if [ "$TOTAL_RAM" -lt 16 ]; then
    echo -e "${RED}Insufficient RAM. Need at least 16GB, found ${TOTAL_RAM}GB${NC}"
    exit 1
fi
echo -e "${GREEN}RAM check passed${NC}"
echo ""

echo "Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed${NC}"
    echo "Install from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}Docker is not running${NC}"
    echo "Start Docker Desktop and try again"
    exit 1
fi
echo -e "${GREEN}Docker is running${NC}"
echo ""

echo "Checking Docker Compose..."
if ! docker-compose version &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed${NC}"
    echo "Install from: https://docs.docker.com/compose/install/"
    exit 1
fi
echo -e "${GREEN}Docker Compose is ready${NC}"
echo ""

echo "Checking Git..."
if ! command -v git &> /dev/null; then
    echo -e "${RED}Git is not installed${NC}"
    echo "Install: brew install git"
    exit 1
fi
echo -e "${GREEN}Git is ready${NC}"
echo ""

echo "Checking disk space..."
AVAILABLE_SPACE=$(df -g . | tail -1 | awk '{print $4}')
if [ "$AVAILABLE_SPACE" -lt 10 ]; then
    echo -e "${YELLOW}Low disk space: ${AVAILABLE_SPACE}GB available${NC}"
    echo "Recommended: 10GB+ free space"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo -e "${GREEN}Disk space: ${AVAILABLE_SPACE}GB available${NC}"
echo ""

echo "Creating directories..."
mkdir -p reviews
mkdir -p src
echo -e "${GREEN}Directories created${NC}"
echo ""

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}Created .env from template${NC}"
    else
        echo "Creating default .env..."
        cat > .env << EOF
MODEL_NAME=qwen2.5-coder:7b
REPO_PATH=.
BASE_BRANCH=main
EOF
        echo -e "${GREEN}Created default .env${NC}"
    fi
else
    echo -e "${GREEN}.env already exists${NC}"
fi
echo ""

echo "Installing Node.js dependencies..."
if [ -f package.json ]; then
    npm install
    echo -e "${GREEN}Dependencies installed${NC}"
else
    echo -e "${YELLOW}package.json not found, skipping npm install${NC}"
fi
echo ""

echo "Building TypeScript..."
if [ -f tsconfig.json ]; then
    npm run build
    echo -e "${GREEN}TypeScript compiled${NC}"
else
    echo -e "${YELLOW}tsconfig.json not found, skipping build${NC}"
fi
echo ""

echo "Building Docker images..."
docker-compose build --pull
echo -e "${GREEN}Docker images built${NC}"
echo ""

echo "Starting Ollama service..."
docker-compose up -d ollama
echo "Waiting for Ollama to be ready..."
sleep 10

MAX_RETRIES=30
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if docker-compose exec -T ollama ollama list &> /dev/null; then
        echo -e "${GREEN}Ollama is ready${NC}"
        break
    fi
    echo "Still waiting... ($((RETRY+1))/$MAX_RETRIES)"
    sleep 2
    RETRY=$((RETRY+1))
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo -e "${RED}Ollama failed to start${NC}"
    echo "Check logs: docker-compose logs ollama"
    exit 1
fi
echo ""

echo "Downloading Qwen2.5-Coder-7B model..."
echo "This may take 5-10 minutes (~4.7GB download)"
echo ""

MODEL_NAME=${MODEL_NAME:-qwen2.5-coder:7b}
docker-compose exec -T ollama ollama pull $MODEL_NAME

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Model downloaded successfully${NC}"
else
    echo -e "${RED}Failed to download model${NC}"
    exit 1
fi
echo ""

echo "Verifying network isolation..."
if docker network inspect local-pr-reviewer_pr-review-network | grep -q '"Internal": true'; then
    echo -e "${GREEN}Network is isolated (internal: true)${NC}"
else
    echo -e "${RED}Warning: Network isolation not confirmed${NC}"
fi
echo ""

echo "Running quick test..."
cat > /tmp/test_ollama.txt << 'EOF'
Write a one-line JavaScript function that returns "Hello, World!"
EOF

RESPONSE=$(docker-compose exec -T ollama ollama run $MODEL_NAME < /tmp/test_ollama.txt 2>&1 | head -5)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Model is responding${NC}"
    echo "Sample response: ${RESPONSE:0:60}..."
else
    echo -e "${RED}Model test failed${NC}"
fi
rm /tmp/test_ollama.txt
echo ""

echo "======================="
echo "Setup Complete!"
echo "======================="
echo ""
echo "System Info:"
echo "  RAM: ${TOTAL_RAM}GB"
echo "  Disk: ${AVAILABLE_SPACE}GB available"
echo "  Model: ${MODEL_NAME}"
echo ""
echo "Next Steps:"
echo "  1. Run: ./scripts/review.sh"
echo "  2. Select a PR to review"
echo "  3. Reviews saved to: ./reviews/"
echo ""
echo "Security:"
echo "  Network isolated (no external access)"
echo "  Code stays on your machine"
echo "  Read-only repo access"
echo ""