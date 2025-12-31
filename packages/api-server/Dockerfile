
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
COPY packages/api-server/package.json packages/api-server/
COPY packages/db/package.json packages/db/
# Copy other packages if needed for workspace resolution or use *
COPY packages/request-handler/package.json packages/request-handler/
COPY packages/build-worker/package.json packages/build-worker/
COPY packages/dashboard/package.json packages/dashboard/
COPY packages/cli/package.json packages/cli/


RUN bun install

# Copy source code
COPY packages/db packages/db
COPY packages/api-server packages/api-server

# Generate Prisma Client
WORKDIR /app/packages/db
RUN bun run db:generate

# Build API Server
WORKDIR /app/packages/api-server
RUN bun run build

EXPOSE 3000
CMD ["bun", "run", "start"]
