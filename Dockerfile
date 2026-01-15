FROM node:20-alpine

RUN apk add --no-cache git openssh-client bash

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

COPY src/ ./src/

RUN npm run build

RUN npm prune --production

RUN mkdir -p /reviews

ENV GIT_CONFIG_GLOBAL=/root/.gitconfig

CMD ["node", "dist/index.js"]