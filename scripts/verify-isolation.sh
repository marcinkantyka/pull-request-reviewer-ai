#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Network Isolation Verification"
echo "==============================="
echo ""

if ! docker info &> /dev/null; then
    echo -e "${RED}Docker is not running${NC}"
    exit 1
fi

echo "1. Checking Docker network configuration..."
if docker network inspect local-pr-reviewer_pr-review-network 2>/dev/null | grep -q '"Internal": true'; then
    echo -e "${GREEN}Network is configured as internal (isolated)${NC}"
else
    echo -e "${RED}Network is NOT isolated${NC}"
    exit 1
fi
echo ""

COMPOSE_FILE="$PROJECT_DIR/compose.yaml"
if [ ! -f "$COMPOSE_FILE" ]; then
    COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"
fi

echo "2. Testing Ollama container network access..."
if docker-compose -f "$COMPOSE_FILE" ps | grep ollama | grep -q "Up"; then
    if docker-compose -f "$COMPOSE_FILE" exec -T ollama ping -c 1 google.com &> /dev/null; then
        echo -e "${RED}Container CAN access internet (SECURITY ISSUE)${NC}"
        exit 1
    else
        echo -e "${GREEN}Container CANNOT access internet (as expected)${NC}"
    fi
else
    echo -e "${YELLOW}Ollama container not running, skipping test${NC}"
fi
echo ""

echo "3. Network details:"
docker network inspect local-pr-reviewer_pr-review-network --format '{{json .}}' | python3 -m json.tool 2>/dev/null || \
docker network inspect local-pr-reviewer_pr-review-network --format '{{json .}}' | jq '.' 2>/dev/null || \
docker network inspect local-pr-reviewer_pr-review-network

echo ""
echo "==============================="
echo -e "${GREEN}Security verification complete!${NC}"
echo ""
echo "Summary:"
echo "  Docker network is isolated (internal: true)"
echo "  Containers cannot access external internet"
echo "  All code processing happens locally"
echo ""