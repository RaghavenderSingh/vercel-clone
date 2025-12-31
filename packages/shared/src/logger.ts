import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

// Custom format for console output (human-readable)
const consoleFormat = printf(({ level, message, timestamp, service, ...metadata }) => {
  let msg = `${timestamp} [${service || 'app'}] ${level}: ${message}`;

  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  return msg;
});

// Create logger instance
const createLogger = (serviceName: string) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: serviceName },
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      json()
    ),
    transports: [
      // Console transport (human-readable in dev, JSON in production)
      new winston.transports.Console({
        format: isDevelopment
          ? combine(colorize(), consoleFormat)
          : combine(json())
      }),

      // Error log file (with rotation)
      new DailyRotateFile({
        filename: `logs/${serviceName}-error-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '14d',
        format: json()
      }),

      // Combined log file (with rotation)
      new DailyRotateFile({
        filename: `logs/${serviceName}-combined-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: json()
      })
    ],
    // Don't exit on exceptions
    exitOnError: false
  });

  // Add helper methods for common logging patterns
  return {
    debug: (message: string, meta?: object) => logger.debug(message, meta),
    info: (message: string, meta?: object) => logger.info(message, meta),
    warn: (message: string, meta?: object) => logger.warn(message, meta),
    error: (message: string, error?: Error | unknown, meta?: object) => {
      if (error instanceof Error) {
        logger.error(message, { error: error.message, stack: error.stack, ...meta });
      } else {
        logger.error(message, { error, ...meta });
      }
    },

    // Deployment-specific logging
    deployment: {
      start: (deploymentId: string, meta?: object) =>
        logger.info('Deployment started', { deploymentId, ...meta }),
      complete: (deploymentId: string, duration: number, meta?: object) =>
        logger.info('Deployment completed', { deploymentId, duration, ...meta }),
      fail: (deploymentId: string, error: Error | string, meta?: object) =>
        logger.error('Deployment failed', { deploymentId, error, ...meta })
    },

    // Build-specific logging
    build: {
      start: (deploymentId: string, command: string, meta?: object) =>
        logger.info('Build started', { deploymentId, command, ...meta }),
      complete: (deploymentId: string, duration: number, meta?: object) =>
        logger.info('Build completed', { deploymentId, duration, ...meta }),
      fail: (deploymentId: string, error: Error | string, meta?: object) =>
        logger.error('Build failed', { deploymentId, error, ...meta })
    },

    // Container-specific logging
    container: {
      start: (containerId: string, deploymentId: string, meta?: object) =>
        logger.info('Container started', { containerId, deploymentId, ...meta }),
      stop: (containerId: string, deploymentId: string, meta?: object) =>
        logger.info('Container stopped', { containerId, deploymentId, ...meta }),
      error: (containerId: string, error: Error | string, meta?: object) =>
        logger.error('Container error', { containerId, error, ...meta })
    },

    // HTTP request logging
    http: (method: string, path: string, statusCode: number, duration: number, meta?: object) =>
      logger.info('HTTP request', { method, path, statusCode, duration, ...meta }),

    // Raw winston logger for advanced use
    raw: logger
  };
};

export type Logger = ReturnType<typeof createLogger>;

export { createLogger };
