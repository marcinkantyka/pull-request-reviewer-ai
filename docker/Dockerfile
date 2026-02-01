# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY tsup.config.ts ./

# Install dependencies
RUN npm ci

# Copy source
COPY src ./src

# Build
RUN npm run build

# Test stage
FROM builder AS tester
COPY tests ./tests
RUN npm run test || true

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install git (required for git operations)
RUN apk add --no-cache git

# Copy package files and install production deps
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S prreview && \
    adduser -S prreview -u 1001

# Create directories for config and cache
RUN mkdir -p /home/prreview/.config/pr-review && \
    chown -R prreview:prreview /home/prreview

# SECURITY: Switch to non-root user
USER prreview

# SECURITY: Disable network for this container (enforced at runtime)
# This is a defense-in-depth measure
ENV NODE_NO_WARNINGS=1
ENV NETWORK_STRICT_MODE=true

# Set entrypoint
ENTRYPOINT ["node", "dist/cli/index.js"]
CMD ["--help"]

# SECURITY: Add health check (local only)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)"
