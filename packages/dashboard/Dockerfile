
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
COPY packages/api-server/package.json packages/api-server/
COPY packages/db/package.json packages/db/
COPY packages/request-handler/package.json packages/request-handler/
COPY packages/build-worker/package.json packages/build-worker/
COPY packages/dashboard/package.json packages/dashboard/
COPY packages/cli/package.json packages/cli/

RUN bun install

# Copy source code
COPY packages/dashboard packages/dashboard

# Build Dashboard
WORKDIR /app/packages/dashboard
# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1
RUN bun run build

EXPOSE 3000
CMD ["bun", "run", "start"]
