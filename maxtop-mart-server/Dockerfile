# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder
WORKDIR /app
# Resilient installs: retry registry fetches so a transient ECONNRESET on the
# build host doesn't fail the whole deploy.
ENV NPM_CONFIG_FETCH_RETRIES=5 NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 NPM_CONFIG_FETCH_TIMEOUT=600000
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache su-exec
ENV NODE_ENV=production NPM_CONFIG_FETCH_RETRIES=5 NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 NPM_CONFIG_FETCH_TIMEOUT=600000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=builder /app/dist ./dist
ENV PORT=5000
EXPOSE 5000
CMD ["sh", "-c", "mkdir -p /app/uploads && chown -R node:node /app/uploads && exec su-exec node node dist/src/server.js"]
