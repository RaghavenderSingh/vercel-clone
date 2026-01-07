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
import { usageService } from "./services/usage.service";
import httpProxy from "http-proxy";
import { createLogger } from "@vercel-clone/shared";

const logger = createLogger('request-handler');

const app = express();
const port = process.env.PORT || 3001;
const proxy = httpProxy.createProxyServer({
  timeout: 30000,
  proxyTimeout: 30000
});

proxy.on('proxyReq', (proxyReq, req, res, options) => {
    if (options.target) {
        let port;
        if (typeof options.target === 'string') {
            const url = new URL(options.target);
            port = url.port;
        } else {
            port = (options.target as any).port;
        }
        proxyReq.setHeader('Host', `localhost:${port}`);
    }
});

proxy.on('proxyRes', (proxyRes, req, res) => {
    const headersToDedupe = ['date', 'server', 'connection'];
    for (const header of headersToDedupe) {
        if (proxyRes.headers[header] && Array.isArray(proxyRes.headers[header])) {
            proxyRes.headers[header] = (proxyRes.headers[header] as string[])[0];
        }
    }
    delete proxyRes.headers['transfer-encoding'];
});

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
        let deployment;

        const domainName = host.split(':')[0];
        const domainRecord = await prisma.domain.findUnique({
            where: { domain: domainName },
        });

        if (domainRecord && domainRecord.verified) {
            deployment = await prisma.deployment.findFirst({
                where: { projectId: domainRecord.projectId, status: "READY" },
                orderBy: { createdAt: "desc" },
            });
            logger.debug('Resolved custom domain', { domain: domainName, projectId: domainRecord.projectId, deploymentId: deployment?.id });
        }

        if (!deployment) {
            deployment = await prisma.deployment.findUnique({
                where: { id: subdomain },
            });
        }

        if (!deployment) {
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

        if (deployment.status.toLowerCase() !== "ready") {
            const status = deployment.status.toLowerCase();
            const message = status === "error" 
                ? "Deployment failed. Please check build logs." 
                : `Deployment is currently ${status}. Please refresh in a few seconds.`;
            
            res.status(status === "error" ? 500 : 202).send(`
                <html>
                    <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #000; color: #fff;">
                        <h2>${message}</h2>
                        <p style="color: #666;">Status: ${status.toUpperCase()}</p>
                        ${status !== "error" ? '<script>setTimeout(() => window.location.reload(), 3000)</script>' : ''}
                    </body>
                </html>
            `);
            return;
        }

        const s3Key = deployment.s3Key || "";
        const outputDir = path.join("/tmp/deployments", deployment.id);
        const startTime = Date.now();

        try {
            const containerStart = Date.now();
            const containerPort = await containerService.getPort(deployment.id, s3Key, outputDir);

            logger.debug('Container ready', { durationMs: Date.now() - containerStart });

            logger.debug('Proxying request to container', {
                deploymentId: deployment.id,
                method: req.method,
                url: req.url,
                containerPort
            });

            let retries = 20;
            const attemptProxy = () => {
                proxy.web(req, res, {
                    target: `http://host.docker.internal:${containerPort}`,
                    changeOrigin: false,
                    xfwd: true,
                }, (err) => {
                    if (err && retries > 0 && !res.headersSent) {
                        retries--;
                        if (retries % 5 === 0) {
                            logger.warn('Proxy attempt failed, retrying...', {
                                remainingRetries: retries,
                                containerPort,
                                error: err.message
                            });
                        }
                        setTimeout(attemptProxy, 1500);
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
            
            const bytesReceived = parseInt(req.headers['content-length'] || '0', 10);
            usageService.logRequest(deployment.projectId, bytesReceived).catch(err => {
                logger.error('Background usage logging failed', err);
            });

            logger.debug('Proxy initialized', { totalMs: Date.now() - startTime });

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

setInterval(async () => {
  try {
    logger.info('Running container cleanup job');
    await containerService.evictInactive(30);
    await containerService.cleanupOrphans();
    logger.info('Container cleanup completed');
  } catch (error) {
    logger.error('Container cleanup error', error instanceof Error ? error : new Error(String(error)));
  }
}, 5 * 60 * 1000);

setInterval(async () => {
  try {
    logger.info('Running cache cleanup job');
    await deploymentCache.cleanupOld(60);
    const stats = deploymentCache.getStats();
    logger.info('Cache cleanup completed', {
      entries: stats.entries,
      totalSizeGB: (stats.totalSize / (1024 * 1024 * 1024)).toFixed(2),
      maxSizeGB: (stats.maxSize / (1024 * 1024 * 1024)).toFixed(2)
    });
  } catch (error) {
    logger.error('Cache cleanup error', error instanceof Error ? error : new Error(String(error)));
  }
}, 10 * 60 * 1000);

const gracefulShutdown = async (signal: string) => {
  logger.info('Received shutdown signal', { signal });

  server.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    await containerService.stopAll();
    logger.info('All containers stopped');
  } catch (error) {
    logger.error('Error stopping containers during shutdown', error instanceof Error ? error : new Error(String(error)));
  }

  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
