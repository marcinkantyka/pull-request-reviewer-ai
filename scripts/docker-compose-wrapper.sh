#!/bin/bash

if command -v docker &> /dev/null && docker compose version &> /dev/null 2>&1; then
    docker compose "$@"
elif command -v docker-compose &> /dev/null; then
    docker-compose "$@"
else
    echo "Error: Neither 'docker compose' nor 'docker-compose' found" >&2
    exit 1
fi
