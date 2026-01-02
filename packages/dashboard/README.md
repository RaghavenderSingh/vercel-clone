# Dashboard

The **Dashboard** is the user interface for the Titan platform. It allows developers to create projects, view build logs, configure settings, and monitor deployments.

## Tech Stack

*   **Framework**: Next.js 14 (App Router)
*   **Styling**: Tailwind CSS
*   **Components**: Shadcn/UI (Radix Primitives)
*   **Icons**: Lucide React
*   **Animations**: Framer Motion

## Key Features

### 1. Project Overview
Displays deployment history, live previews (via iframe), and git integration status.

### 2. Live Build Logs
Connects to the API Server via WebSocket to stream build logs in real-time as they happen in the Build Worker.

### 3. Settings Management
UI for configuring environment variables, custom domains, and build commands.

## Architecture

*   `app/`: Next.js App Router pages.
*   `components/`: Reusable UI components.
    *   `ui/`: Primitive Shadcn components (Button, Input, etc.).
    *   `projects/`: Domain-specific components.
*   `lib/api.ts`: Typed Axios client for communicating with the API Server.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Browser-accessible API URL |
| `INTERNAL_API_URL` | Server-side API URL (Docker networking) |
| `NEXTAUTH_SECRET` | Session encryption key |
| `GITHUB_CLIENT_ID` | OAuth Client ID |
| `GITHUB_CLIENT_SECRET` | OAuth Client Secret |

## Development

```bash
bun run dev
```
