# Titan CLI

The **Titan CLI** enables developers to deploy projects directly from their terminal, similar to the `vercel` command.

## Installation

```bash
npm install -g titan-cli
# or run directly
bun packages/cli/index.ts
```

## Commands

### `titan login`
Authenticates the user via GitHub.
*   Opens a browser window for OAuth.
*   Saves the session token to `~/.titan/config.json`.

### `titan deploy`
Deploys the current directory.
1.  **Archive**: Zips the current folder (respecting `.gitignore` if possible).
2.  **Upload**: PUTs the zip file to the API Server.
3.  **Monitor**: Polling mechanism to wait for build completion.
4.  **Finish**: Returns the production URL.

## Architecture

*   **Parsers**: Uses `commander` for argument parsing.
*   **Config**: Stores credentials in the user's home directory.
*   **Client**: Uses `axios` to communicate with the Titan API.

## Development

Link the package globally:

```bash
cd packages/cli
npm link
```
