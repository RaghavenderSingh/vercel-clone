# Stage 1: Install dependencies only (shared across all services)
FROM oven/bun:1 AS deps
WORKDIR /app

# Install system dependencies for native modules and Docker CLI
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    ca-certificates \
    curl \
    gnupg \
    && install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
    && chmod a+r /etc/apt/keyrings/docker.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update && apt-get install -y docker-ce-cli \
    && rm -rf /var/lib/apt/lists/*

# Copy package files for workspace dependency resolution
COPY package.json bun.lock* ./
COPY packages/api-server/package.json ./packages/api-server/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/build-worker/package.json ./packages/build-worker/
COPY packages/dashboard/package.json ./packages/dashboard/
COPY packages/request-handler/package.json ./packages/request-handler/
COPY packages/ai-service/package.json ./packages/ai-service/
COPY packages/cli/package.json ./packages/cli/

# Install all dependencies
RUN bun install --ignore-scripts

# Stage 2: Generate Prisma client (depends on deps)
FROM deps AS builder-base

# Copy all source code once to share across build stages
COPY packages/db ./packages/db
COPY packages/shared ./packages/shared
COPY packages/ai-service ./packages/ai-service
COPY packages/api-server ./packages/api-server
COPY packages/build-worker ./packages/build-worker
COPY packages/request-handler ./packages/request-handler
COPY packages/dashboard ./packages/dashboard

WORKDIR /app/packages/db
WORKDIR /app/packages/db
RUN bun run db:generate

WORKDIR /app/packages/shared
RUN bun run build

WORKDIR /app/packages/ai-service
RUN bun run build

# Stage 3: Build Dashboard
FROM builder-base AS dashboard-builder
WORKDIR /app/packages/dashboard
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN bun run build

# Dashboard runner (minimal production image)
FROM node:20-alpine AS dashboard-runner
WORKDIR /app
COPY --from=dashboard-builder /app/packages/dashboard/.next/standalone ./
COPY --from=dashboard-builder /app/packages/dashboard/.next/static ./.next/static
COPY --from=dashboard-builder /app/packages/dashboard/public ./public
ENV NODE_ENV=production
# Install production dependencies (standalone build has package.json)
# Install production dependencies (standalone build has package.json)
# RUN npm install --omit=dev
# Install production dependencies (standalone build has package.json)
# RUN npm install --omit=dev
RUN rm package.json && npm cache clean --force && npm install next@14.2.0 sharp
EXPOSE 3000
CMD ["node", "server.js"]

# Stage 4: Build API Server
FROM builder-base AS api-builder
WORKDIR /app/packages/api-server
RUN bun run build

# API Server runner
FROM api-builder AS api-server
WORKDIR /app/packages/api-server
EXPOSE 3001
CMD ["bun", "dist/index.js"]

# Stage 5: Build Request Handler
FROM builder-base AS request-handler-builder
WORKDIR /app/packages/request-handler
RUN bun run build

# Request Handler runner
FROM request-handler-builder AS request-handler
WORKDIR /app/packages/request-handler
EXPOSE 3002
CMD ["bun", "dist/index.js"]

# Stage 6: Build Worker
FROM builder-base AS build-worker-builder
WORKDIR /app/packages/build-worker
RUN bun run build

# Build Worker runner
FROM build-worker-builder AS build-worker
WORKDIR /app/packages/build-worker
CMD ["bun", "dist/index.js"]
