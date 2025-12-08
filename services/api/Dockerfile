# API Service Dockerfile
# Multi-stage build for optimized production image

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY services/api/package*.json ./services/api/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
WORKDIR /app/services/api
RUN npm ci

# Copy source code
COPY services/api/ ./
COPY packages/shared/ /app/packages/shared/

# Build shared package first
WORKDIR /app/packages/shared
RUN npm ci && npm run build

# Build API
WORKDIR /app/services/api
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package.json, node_modules and built files from builder
COPY --from=builder /app/services/api/package.json ./
COPY --from=builder /app/services/api/node_modules ./node_modules
COPY --from=builder /app/services/api/dist ./dist

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
