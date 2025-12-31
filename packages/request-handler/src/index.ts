import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { prisma } from "@titan/db";
import { s3Service } from "./services/s3.service";
import path from "path";
import fs from "fs";
import { containerService } from "./services/container.service";
import { deploymentCache } from "./services/cache.service";
import httpProxy from "http-proxy";
import { createLogger } from "@vercel-clone/shared";

const logger = createLogger('request-handler');

const app = express();
const port = process.env.PORT || 3001;
const proxy = httpProxy.createProxyServer({
  timeout: 30000,      // 30 second timeout
  proxyTimeout: 30000  // 30 second proxy timeout
});

// Handle proxy errors globally
proxy.on('error', (err, req, res) => {
  logger.error('Proxy error', err, { url: req.url, method: req.method });
  if (res && 'headersSent' in res && !res.headersSent) {
    (res as express.Response).status(502).json({
      error: 'Bad Gateway',
      message: 'Failed to connect to deployment'
    });
  }
});

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "request-handler" });
});

app.all("*", async (req, res) => {
    const host = req.headers.host;
    if (!host) {
        res.status(400).send("Missing Host header");
        return;
    }

    const subdomain = host.split(".")[0];
    logger.http(req.method, req.url, 0, 0, { subdomain, host });

    try {
        // 1. Resolve Deployment
        let deployment = await prisma.deployment.findUnique({
            where: { id: subdomain },
        });

        if (!deployment) {
            // Try finding by project name
            const project = await prisma.project.findFirst({
                where: { name: subdomain },
            });

            if (project) {
                deployment = await prisma.deployment.findFirst({
                    where: { projectId: project.id, status: "READY" },
                    orderBy: { createdAt: "desc" },
                });
            }
        }

        if (!deployment) {
            res.status(404).send(`Deployment not found for ${subdomain}`);
            return;
        }

        // 2. Determine Deployment Type & Fetch Code if needed
        const s3Key = deployment.s3Key || "";
        const isDockerImage = s3Key.startsWith("docker:");
        const outputDir = path.join("/tmp/deployments", deployment.id);

        // Only download artifacts if it's NOT a custom docker image
        // (Custom images are already in the docker daemon, no files needed locally)
        if (!isDockerImage) {
            if (!fs.existsSync(outputDir)) {
                logger.info('Cache miss - downloading deployment', { deploymentId: deployment.id, outputDir });
                await s3Service.downloadDeployment(deployment.id, outputDir);
            } else {
                logger.debug('Cache hit - deployment ready', { deploymentId: deployment.id });
            }
            // Mark as accessed for LRU cache management
            await deploymentCache.markAccessed(deployment.id);
        }

        // 3. Get / Start Container
        try {
            const containerPort = await containerService.getPort(deployment.id, s3Key, outputDir);

            logger.debug('Proxying request to container', {
                deploymentId: deployment.id,
                method: req.method,
                url: req.url,
                containerPort
            });

            // Listen to proxyReq to modify headers before sending to container
            proxy.once('proxyReq', (proxyReq, _request, _response) => {
                // Fix Host header to localhost instead of subdomain
                proxyReq.setHeader('Host', `localhost:${containerPort}`);
            });

            // 4. Proxy to Container with retry logic
            let retries = 2;
            const attemptProxy = () => {
                proxy.web(req, res, {
                    target: `http://127.0.0.1:${containerPort}`,
                    changeOrigin: false,
                    preserveHeaderKeyCase: false,
                    followRedirects: false,
                    ignorePath: false,
                }, (err) => {
                    if (err && retries > 0 && !res.headersSent) {
                        retries--;
                        logger.warn('Proxy attempt failed, retrying', {
                            attempt: 2 - retries,
                            maxRetries: 2,
                            containerPort,
                            error: err.message
                        });
                        setTimeout(attemptProxy, 1000); // Retry after 1 second
                    } else if (err) {
                        logger.error('All proxy retries failed', err, { containerPort });
                        if (!res.headersSent) {
                            res.status(502).json({
                                error: 'Service Unavailable',
                                message: 'Deployment is not responding'
                            });
                        }
                    }
                });
            };
            attemptProxy();

        } catch (error) {
            logger.error('Runtime error starting container', error instanceof Error ? error : new Error(String(error)), {
                deploymentId: deployment?.id
            });
            res.status(500).send("Failed to start containerized function");
        }

    } catch (error) {
        logger.error('Request handler error', error instanceof Error ? error : new Error(String(error)), {
            host,
            subdomain,
            url: req.url
        });
        res.status(500).send("Internal Server Error: " + (error instanceof Error ? error.message : String(error)));
    }
});

const server = app.listen(port, () => {
  logger.info('Request Handler started', { port, service: 'request-handler' });
});

// Background job: Clean up inactive containers every 5 minutes
setInterval(async () => {
  try {
    logger.info('Running container cleanup job');
    await containerService.evictInactive(30); // Evict containers idle for 30+ minutes
    await containerService.cleanupOrphans(); // Cleanup orphaned containers
    logger.info('Container cleanup completed');
  } catch (error) {
    logger.error('Container cleanup error', error instanceof Error ? error : new Error(String(error)));
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Background job: Clean up old cached deployments every 10 minutes
setInterval(async () => {
  try {
    logger.info('Running cache cleanup job');
    await deploymentCache.cleanupOld(60); // Remove deployments not accessed in 60+ minutes
    const stats = deploymentCache.getStats();
    logger.info('Cache cleanup completed', {
      entries: stats.entries,
      totalSizeGB: (stats.totalSize / (1024 * 1024 * 1024)).toFixed(2),
      maxSizeGB: (stats.maxSize / (1024 * 1024 * 1024)).toFixed(2)
    });
  } catch (error) {
    logger.error('Cache cleanup error', error instanceof Error ? error : new Error(String(error)));
  }
}, 10 * 60 * 1000); // Every 10 minutes

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  logger.info('Received shutdown signal', { signal });

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Stop all containers
  try {
    await containerService.stopAll();
    logger.info('All containers stopped');
  } catch (error) {
    logger.error('Error stopping containers during shutdown', error instanceof Error ? error : new Error(String(error)));
  }

  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT")); // Ctrl+C
