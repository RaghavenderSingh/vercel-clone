# Build Worker

The **Build Worker** is a background service responsible for compiling user code into static assets or Docker images. It runs independently of the API server to ensure scalability and isolation.

## Architecture

*   **Process Model**: Consumer-based (pulls from Redis `build-queue`).
*   **Isolation**: Uses **Docker-in-Docker** (or sibling containers) to build user code safely.
*   **Storage**: Uploads build artifacts to an S3-compatible service.

## The Build Process

1.  **Job Receipt**: Listens for `BuildJob` messages on Redis.
2.  **Clone/Extract**:
    *   **Git**: Clones the specific branch/commit using `git clone`.
    *   **Zip**: Downloads and extracts the uploaded source bundle.
3.  **Analysis**: Detects framework (Next.js, Vite, etc.) and auto-configures settings (e.g., `next.config.js` output mode).
4.  **Containerized Build**:
    *   Spawns a temporary Docker container mounting the source code.
    *   Runs `installCommand` (e.g., `npm install`).
    *   Runs `buildCommand` (e.g., `npm run build`).
5.  **Artifact Upload**:
    *   Detects output directory (`.next/standalone`, `dist`, `build`).
    *   Uploads contents to S3 under `deployments/<id>`.
6.  **Cleanup**: Removes temporary files and containers.

## Security

*   **No Shell Execution**: Commands are executed directly via Docker API to avoid shell injection.
*   **Ephemeral Containers**: Build environments are destroyed immediately after use.
*   **Resource Limits**: (Configurable) CPU/Memory limits can be applied to build containers.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `REDIS_URL` | Connection to job queue |
| `S3_BUCKET` | Target bucket for artifacts |
| `AWS_ACCESS_KEY_ID` | Storage credentials |
| `AWS_SECRET_ACCESS_KEY` | Storage credentials |
| `DOCKER_SOCKET_PATH` | Path to host Docker socket (default: `/var/run/docker.sock`) |

## Development

Start the worker:

```bash
bun run dev
```
