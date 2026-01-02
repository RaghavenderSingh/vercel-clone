# Request Handler

The **Request Handler** is the edge service responsible for serving deployed user applications. It acts as a smart reverse proxy that maps incoming subdomains (e.g., `project-xyz.titan.com`) to the correct S3 artifacts.

## Architecture

*   **Runtime**: Node.js / Express
*   **Resolution Strategy**:
    1.  Extracts `Host` header to determine subdomain.
    2.  Queries Postgres to find the associated `Deployment`.
    3.  Checks local disk cache (`/tmp/deployments`).
    4.  If missing, downloads from S3.
    5.  Proxies the request to the serving layer (Container or Static Files).

## Features

### Dynamic Routing
Automatically handles wildcard domains (`*.titan.com`). It supports both:
*   **Subdomains**: `my-project.titan.com`
*   **Custom Domains**: `www.my-startup.com` (via CNAME configuration)

### Caching
Implements a two-tier caching strategy:
1.  **Disk Cache**: Downloaded S3 artifacts are stored on SSD for fast access.
2.  **LRU Eviction**: Unused deployments are cleaned up periodically to manage disk space.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Service port (default: 3001) |
| `DATABASE_URL` | To resolve domain->deployment mapping |
| `S3_BUCKET` | Source of build artifacts |
| `AWS_ACCESS_KEY_ID` | Storage credentials |
| `AWS_SECRET_ACCESS_KEY` | Storage credentials |

## Development

```bash
bun run dev
```
