# Deployment Guide

## Option 1: Docker 

Run the entire system with a single command. This requires Docker and Docker Compose installed.

```bash
docker-compose up --build
```

The services will be available at:
- **API Server**: http://localhost:3000
- **Dashboard**: http://localhost:3001
- **Request Handler**: http://localhost:3002

## Option 2: Manual Startup

If you prefer to run services individually without Docker, follow these steps.

### Prerequisites
- Node.js (v18+) or Bun (v1.0+)
- PostgreSQL (Running locally or hosted)
- Redis (Running locally or hosted)

### 1. Database Setup
Ensure you have a `.env` file in `packages/db` or `packages/api-server` (or set env vars globally).

```bash
# Install dependencies
bun install

# Generate Prisma Client
cd packages/db
bun run db:generate

# Push Schema to DB (Run from api-server or db package)
cd ../api-server
bun run prisma:migrate
```

### 2. Start Services

Open 4 separate terminal windows/tabs:

**Terminal 1: API Server**
```bash
cd packages/api-server
bun run dev
```

**Terminal 2: Build Worker**
```bash
cd packages/build-worker
bun run dev
```

**Terminal 3: Request Handler**
```bash
cd packages/request-handler
bun run dev
```

**Terminal 4: Dashboard**
```bash
cd packages/dashboard
bun run dev
```

### 3. CLI Tool

To use the CLI:

```bash
cd packages/cli
bun run build
# Link globally
npm link 
# Or run directly
./bin/titan.js login
```
