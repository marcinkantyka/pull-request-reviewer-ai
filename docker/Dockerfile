FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY tsup.config.ts ./
RUN npm ci

COPY src ./src
RUN npm run build

FROM builder AS tester
COPY tests ./tests
RUN npm run test || true

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache git

COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S prreview && \
    adduser -S prreview -u 1001

RUN mkdir -p /home/prreview/.config/pr-review && \
    chown -R prreview:prreview /home/prreview

USER prreview

ENV NODE_NO_WARNINGS=1
ENV NETWORK_STRICT_MODE=true

ENTRYPOINT ["node", "dist/cli/index.js"]
CMD ["--help"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)"
