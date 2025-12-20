# Worker Service Dockerfile
# Multi-stage build for optimized production image
# Phase 2.2: Updated for Puppeteer/Chromium support

FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY services/worker/package*.json ./services/worker/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
WORKDIR /app/services/worker
RUN npm ci

# Copy source code
COPY services/worker/ ./
COPY packages/shared/ /app/packages/shared/

# Build shared package first
WORKDIR /app/packages/shared
RUN npm ci && npm run build

# Build worker
WORKDIR /app/services/worker
RUN npm run build

# Production stage - using slim image with Chromium for Puppeteer
FROM node:20-slim AS production

# Install Chromium and dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package.json, node_modules and built files from builder
COPY --from=builder /app/services/worker/package.json ./
COPY --from=builder /app/services/worker/node_modules ./node_modules
COPY --from=builder /app/services/worker/dist ./dist

# Prune dev dependencies FIRST
RUN npm prune --omit=dev

# Copy shared package AFTER prune (workspace package)
COPY --from=builder /app/packages/shared/dist ./node_modules/@resume-generator/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@resume-generator/shared/
# Copy zod dependency for shared package (needed at runtime)
COPY --from=builder /app/packages/shared/node_modules/zod ./node_modules/@resume-generator/shared/node_modules/zod

# Fix permissions for node user
RUN chmod -R 755 ./node_modules/@resume-generator/shared/

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Run as non-root user
USER node

EXPOSE 8080

CMD ["node", "dist/index.js"]
