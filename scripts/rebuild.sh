#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "Rebuilding Project"
echo "=================="
echo ""

cd "$PROJECT_DIR"

echo "Cleaning previous build..."
rm -rf dist
echo -e "${GREEN}Clean complete${NC}"
echo ""

echo "Building TypeScript..."
if npm run build; then
    echo -e "${GREEN}TypeScript build successful${NC}"
else
    echo -e "${RED}TypeScript build failed${NC}"
    exit 1
fi
echo ""

echo "Rebuilding Docker image..."
if docker-compose build pr-reviewer; then
    echo -e "${GREEN}Docker build successful${NC}"
else
    echo -e "${RED}Docker build failed${NC}"
    exit 1
fi
echo ""

echo "=================="
echo -e "${GREEN}Rebuild complete!${NC}"
echo ""
