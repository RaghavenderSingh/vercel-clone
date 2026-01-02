# API Server

The **API Server** is the central nervous system of the Titan platform. It manages project configuration, deployment orchestration, user authentication, and third-party integrations (GitHub).

## Architecture

*   **Framework**: Express.js with TypeScript
*   **Database**: PostgreSQL (via Prisma ORM)
*   **Queue**: Redis (BullMQ) for dispatching build jobs
*   **Authentication**: JWT-based session management

## Key Components

### 1. Deployment Controller
Handles the lifecycle of a deployment:
- Validates zip uploads or Git commits.
- Creates `Deployment` records in Postgres.
- Pushes jobs to the `build-queue` for the Build Worker.

### 2. GitHub Webhooks
Listens for push events from connected repositories to trigger automatic deployments.
- Endpoint: `/api/webhooks/github`
- Verifies signatures to ensure security.

### 3. Project Management
CRUD operations for Projects, managing:
- Environment Variables (stored encrypted)
- Build configurations (Command, Output directory)
- Domain mapping

## API Routes

### Authentication
*   `GET /auth/github`: Initiates GitHub OAuth flow.
*   `GET /auth/github/callback`: Handles OAuth callback and issues JWT.
*   `GET /auth/me`: user profile.

### Deployments
*   `POST /deploy`: Manually trigger a deployment.
*   `GET /deployments/:id`: Get deployment status and logs.
*   `GET /project/:id/deployments`: List project history.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret for signing session tokens |
| `AWS_ACCESS_KEY_ID` | For S3 upload presigning (if applicable) |
| `AWS_SECRET_ACCESS_KEY` | For S3 upload presigning |

## Development

Run the development server:

```bash
bun run dev
```

Build for production:

```bash
bun run build
```
