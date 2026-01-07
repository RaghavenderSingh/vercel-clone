/**
 * Command Sanitizer - Prevents command injection attacks
 */

import { createLogger } from "@vercel-clone/shared";

const logger = createLogger('build-worker');

const ALLOWED_COMMANDS = ['npm', 'yarn', 'pnpm', 'bun', 'node'];

const ALLOWED_ENV_PREFIXES = ['NPM_', 'YARN_', 'PNPM_', 'BUN_'];
const ALLOWED_ENV_KEYS = ['NODE_ENV', 'PORT', 'HOSTNAME', 'PATH', 'HOME'];

/**
 * Validate that a command is in the whitelist
 */
export function validateCommand(command: string): void {
  if (!ALLOWED_COMMANDS.includes(command)) {
    throw new Error(`Command not allowed: ${command}. Allowed: ${ALLOWED_COMMANDS.join(', ')}`);
  }
}

/**
 * Validate command arguments for dangerous patterns
 */
export function validateArguments(args: string[]): void {
  const dangerousPatterns = [
    /[;&|`$()]/,
    /\.\.\//,
  ];

  for (const arg of args) {
    if (arg.length > 200) {
      throw new Error('Argument too long (max 200 characters)');
    }

    for (const pattern of dangerousPatterns) {
      if (pattern.test(arg)) {
        throw new Error(`Argument contains dangerous pattern: ${arg}`);
      }
    }
  }
}

/**
 * Parse command string safely
 * This is a simple parser - for production, consider using a proper shell parser
 */
export function parseCommand(commandString: string): { command: string; args: string[] } {
  const parts = commandString.trim().split(/\s+/);

  if (parts.length === 0) {
    throw new Error('Empty command string');
  }

  const command = parts[0];
  const args = parts.slice(1);

  validateCommand(command);
  validateArguments(args);

  return { command, args };
}

/**
 * Filter environment variables to only safe ones
 */
export function filterEnvironmentVariables(
  envVars: Record<string, string> = {},
  userEnvVars: Record<string, string> = {}
): string[] {
  const filtered: Record<string, string> = {};

  for (const [key, value] of Object.entries(envVars)) {
    if (ALLOWED_ENV_KEYS.includes(key) ||
        ALLOWED_ENV_PREFIXES.some(prefix => key.startsWith(prefix))) {
      filtered[key] = value;
    }
  }

  for (const [key, value] of Object.entries(userEnvVars)) {
    if (key === 'PATH' || key === 'HOME') {
      continue;
    }

    if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
      logger.warn('Skipping invalid environment variable key', { key });
      continue;
    }

    if (value.includes('\0') || value.length > 10000) {
      logger.warn('Skipping invalid environment variable value', { key, valueLength: value.length });
      continue;
    }

    filtered[key] = value;
  }

  return Object.entries(filtered).map(([k, v]) => `${k}=${v}`);
}

/**
 * Sanitize a full command for safe execution
 */
export function sanitizeCommand(
  commandString: string,
  userEnvVars: Record<string, string> = {}
): {
  command: string[];
  env: string[];
} {
  const { command, args } = parseCommand(commandString);

  const safeCommand = [command, ...args];

  const defaultEnv = {
    NODE_ENV: 'production',
    NPM_CONFIG_LOGLEVEL: 'warn',
    PATH: '/usr/local/bin:/usr/bin:/bin',
    HOME: '/root',
  };

  const env = filterEnvironmentVariables(defaultEnv, userEnvVars);

  return {
    command: safeCommand,
    env,
  };
}
