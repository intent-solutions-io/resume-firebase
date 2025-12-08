# Worker Service Dockerfile
# Multi-stage build for optimized production image

FROM node:20-alpine AS builder

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

# Production stage
FROM node:20-alpine AS production

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

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Run as non-root user
USER node

EXPOSE 8080

CMD ["node", "dist/index.js"]
