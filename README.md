# Titan Platform

Titan is an automated deployment platform with GitHub integration, intelligent error analysis, and comprehensive project management. It provides automated CI/CD pipelines, build workers for Node.js and Docker projects, and AI-powered error diagnostics.

## Architecture

The platform follows a microservices-monorepo architecture:

*   **API Server**: [packages/api-server](packages/api-server/README.md) - Core REST API and webhook handling logic.
*   **Build Worker**: [packages/build-worker](packages/build-worker/README.md) - Background service responsible for building projects types (Node.js, Docker, etc.) via a Redis queue.
*   **Request Handler**: [packages/request-handler](packages/request-handler/README.md) - Dynamic proxy that serves deployed applications and handles caching.
*   **Dashboard**: [packages/dashboard](packages/dashboard/README.md) - Next.js-based administration interface.
*   **CLI**: [packages/cli](packages/cli/README.md) - Command line interface for interacting with Titan.
*   **AI Service**: [packages/ai-service](packages/ai-service/README.md) - Analyzes build failures and suggests fixes.
*   **DB**: `packages/db` - Prisma database schema and migrations.
*   **Shared**: `packages/shared` - Shared utilities and types across services.

## Quick Start

### 1. Installation

Install all dependencies using Bun.

```bash
bun install
```

### 2. Configuration

Copy the example environment file and configure the necessary secrets.

```bash
cp .env.example .env
```

Generate secure secrets for `JWT_SECRET` and `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

Initialize the environment across all packages:

```bash
bun run setup
```

### 3. Database

Apply database migrations:

```bash
bun run db:migrate
```

### 4. Running Locally

Start all services in development mode:

```bash
bun run dev
```

This commands launches:
*   **Dashboard**: http://localhost:3001
*   **API Server**: http://localhost:3000
*   **Request Handler**: http://localhost:8000

## Deployment

For production deployment instructions on AWS (EC2), please refer to [DEPLOYMENT.md](DEPLOYMENT.md).

## Development Commands

*   `bun run dev`: Start all services.
*   `bun run build:all`: Compile all packages.
*   `bun run db:studio`: Open database GUI.
*   `bun run db:migrate`: Run pending migrations.

## License

MIT
