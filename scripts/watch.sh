#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "File Watcher - Auto Rebuild on Changes"
echo "========================================"
echo ""
echo "Watching for changes in: $PROJECT_DIR"
echo "Press Ctrl+C to stop"
echo ""

cd "$PROJECT_DIR"

rebuild() {
    echo ""
    echo -e "${YELLOW}Changes detected - rebuilding...${NC}"
    echo "----------------------------------------"
    
    echo "Building TypeScript..."
    if npm run build; then
        echo -e "${GREEN}TypeScript build successful${NC}"
    else
        echo -e "${RED}TypeScript build failed${NC}"
        return 1
    fi
    
    echo "Rebuilding Docker image..."
    if docker-compose build pr-reviewer; then
        echo -e "${GREEN}Docker build successful${NC}"
    else
        echo -e "${RED}Docker build failed${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Rebuild complete!${NC}"
    echo "----------------------------------------"
    echo ""
}

if ! command -v fswatch &> /dev/null; then
    echo -e "${YELLOW}fswatch not found. Installing via Homebrew...${NC}"
    echo "Run: brew install fswatch"
    echo ""
    echo "Alternative: Manual rebuild script available"
    exit 1
fi

rebuild

fswatch -o \
    --exclude='\.git' \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='reviews' \
    --exclude='\.DS_Store' \
    "$PROJECT_DIR" | while read f; do
    rebuild
done
