import Docker from "dockerode";
import path from "path";
import fs from "fs";
import getPort from "get-port";
import { createLogger } from "@vercel-clone/shared";
import { s3Service } from "./s3.service";
import { deploymentCache } from "./cache.service";

const logger = createLogger('request-handler');
const docker = new Docker({ socketPath: process.env.DOCKER_SOCKET_PATH || "/var/run/docker.sock" });

interface ContainerInfo {
    containerId: string;
    port: number;
    lastAccess: number;
}

export class ContainerService {
    private containers: Map<string, ContainerInfo> = new Map();
    private bootMutex: Map<string, Promise<number>> = new Map();

    async getPort(deploymentId: string, s3Key: string | null, localPath: string): Promise<number> {
        // 1. Check if running
        if (this.containers.has(deploymentId)) {
            const info = this.containers.get(deploymentId)!;
            try {
                const container = docker.getContainer(info.containerId);
                const state = await container.inspect();
                if (state.State.Running) {
                    info.lastAccess = Date.now();
                    return info.port;
                }
            } catch (e) {
                this.containers.delete(deploymentId);
            }
        }

        // 2. Check if already booting (Mutex)
        if (this.bootMutex.has(deploymentId)) {
            logger.debug('Waiting for existing boot process', { deploymentId });
            return this.bootMutex.get(deploymentId)!;
        }

        const bootTask = async (): Promise<number> => {
            const absolutePath = path.resolve(localPath);
            const isDockerImage = s3Key?.startsWith("docker:");

            // 1. Ensure artifacts are present if NOT a Docker image
            if (!isDockerImage) {
                const readyMarker = path.join(absolutePath, ".ready");
                if (!fs.existsSync(readyMarker)) {
                    logger.info('Cache miss or incomplete download - downloading deployment', { deploymentId, outputDir: absolutePath });
                    const dlStart = Date.now();
                    await s3Service.downloadDeployment(deploymentId, absolutePath);
                    logger.debug('S3 Download complete', { durationMs: Date.now() - dlStart });
                } else {
                    logger.debug('Cache hit - deployment ready', { deploymentId });
                }
                await deploymentCache.markAccessed(deploymentId);
            }

            const port = await getPort();
            const containerName = `titan-${deploymentId}`;
            
            let container;
            const createStart = Date.now();

            try {
                const existing = docker.getContainer(containerName);
                await existing.stop({ t: 1 }).catch(() => {});
                await existing.remove({ force: true }).catch(() => {});
            } catch (e) {}

            if (isDockerImage) {
                const imageName = s3Key!.replace("docker:", "");
                logger.info('Booting custom Docker image', { deploymentId, imageName, name: containerName });

                container = await docker.createContainer({
                    Image: imageName,
                    name: containerName,
                    Tty: false,
                    ExposedPorts: { "3000/tcp": {} },
                    HostConfig: {
                        PortBindings: { "3000/tcp": [{ HostPort: String(port) }] },
                        AutoRemove: false,
                        Memory: 512 * 1024 * 1024,
                        MemorySwap: 512 * 1024 * 1024,
                        NanoCpus: 1000000000,
                        PidsLimit: 100,
                        SecurityOpt: ["no-new-privileges"]
                    }
                });
            } else {
                logger.info('Booting standard Node.js runtime', { deploymentId, localPath, name: containerName });

                let startCommand = ["node", "server.js"];
                try {
                    const serverJsPath = path.join(absolutePath, "server.js");
                    if (fs.existsSync(serverJsPath)) {
                        startCommand = ["node", "server.js"];
                    } else {
                        const packageJsonPath = path.join(absolutePath, "package.json");
                        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
                        if (packageJson.scripts?.start) startCommand = ["npm", "start"];
                        else if (packageJson.main) startCommand = ["node", packageJson.main];
                    }
                } catch (error) {}

                const hostDeployBase = process.env.HOST_DEPLOY_PATH || "/tmp/deployments";
                const relativePathFromBase = localPath.replace("/tmp/deployments/", "");
                const hostPath = path.join(hostDeployBase, relativePathFromBase);

                container = await docker.createContainer({
                    Image: "node:20-alpine",
                    name: containerName,
                    Cmd: startCommand,
                    WorkingDir: "/app",
                    Tty: false,
                    ExposedPorts: { "3000/tcp": {} },
                    HostConfig: {
                        Binds: [`${hostPath}:/app`],
                        PortBindings: { "3000/tcp": [{ HostPort: String(port) }] },
                        AutoRemove: false,
                        Memory: 512 * 1024 * 1024,
                        MemorySwap: 512 * 1024 * 1024,
                        NanoCpus: 1000000000,
                        PidsLimit: 100,
                        SecurityOpt: ["no-new-privileges"]
                    },
                    Env: ["PORT=3000", "HOSTNAME=0.0.0.0"]
                });
            }

            await container.start();
            logger.container.start(container.id, deploymentId, { port, name: containerName });

            const healthStart = Date.now();
            await this.waitForHealthy(port, deploymentId, 60000, container.id);
            logger.debug('Container health verified', { durationMs: Date.now() - healthStart, totalBootTime: Date.now() - createStart, deploymentId });

            this.containers.set(deploymentId, {
                containerId: container.id,
                port,
                lastAccess: Date.now()
            });
            return port;
        };

        const promise = bootTask().finally(() => {
            this.bootMutex.delete(deploymentId);
        });

        this.bootMutex.set(deploymentId, promise);
        return promise;
    }

    /**
     * Wait for container to become healthy by polling its port
     */
    private async waitForHealthy(port: number, deploymentId: string, timeout: number = 30000, containerId?: string): Promise<void> {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            try {
                if (containerId && Date.now() % 2000 < 200) {
                    const container = docker.getContainer(containerId);
                    const state = await container.inspect();
                    if (!state.State.Running) {
                        throw new Error(`Container stopped unexpectedly with exit code ${state.State.ExitCode}`);
                    }
                }

                const response = await fetch(`http://host.docker.internal:${port}/`, {
                    signal: AbortSignal.timeout(1000)
                });
                if (response.ok || response.status === 404) {
                    logger.info('Container healthy', { deploymentId, port });
                    return;
                }
            } catch (e) {
                if (Date.now() % 5000 < 200) {
                    logger.debug('Health check attempt failed', { 
                        deploymentId, 
                        port, 
                        error: e instanceof Error ? e.message : String(e) 
                    });
                }
            }
            await new Promise(r => setTimeout(r, 200));
        }
        throw new Error(`Container failed to become healthy within ${timeout}ms. Check container logs for deployment ${deploymentId}.`);
    }

    /**
     * Evict containers that haven't been accessed for ttlMinutes
     */
    async evictInactive(ttlMinutes: number = 30): Promise<void> {
        const cutoff = Date.now() - ttlMinutes * 60 * 1000;
        const evicted: string[] = [];

        for (const [deploymentId, info] of this.containers) {
            if (info.lastAccess < cutoff) {
                try {
                    const container = docker.getContainer(info.containerId);
                    await container.stop();
                    this.containers.delete(deploymentId);
                    evicted.push(deploymentId);
                } catch (error) {
                    logger.error('Failed to evict container', error instanceof Error ? error : new Error(String(error)), { deploymentId });
                }
            }
        }

        if (evicted.length > 0) {
            logger.info('Evicted inactive containers', { count: evicted.length, evicted });
        }
    }

    /**
     * Find and cleanup orphaned containers not in our registry
     */
    async cleanupOrphans(): Promise<void> {
        try {
            const allContainers = await docker.listContainers({ all: false });
            const orphans = allContainers.filter(c => {
                const name = c.Names[0] || "";
                
                if (
                    name.includes("titan-dashboard") ||
                    name.includes("titan-api-server") ||
                    name.includes("titan-request-handler") ||
                    name.includes("titan-build-worker") ||
                    name.includes("titan-postgres") ||
                    name.includes("titan-redis")
                ) {
                    return false;
                }

                return name.includes("titan-") && !Array.from(this.containers.values()).some(info => info.containerId === c.Id);
            });

            for (const orphan of orphans) {
                try {
                    const container = docker.getContainer(orphan.Id);
                    await container.stop();
                    console.log(`[ContainerService] Cleaned up orphan container: ${orphan.Names[0]}`);
                } catch (error) {
                    console.error(`Failed to cleanup orphan ${orphan.Id}:`, error);
                }
            }

            if (orphans.length > 0) {
                console.log(`[ContainerService] Cleaned up ${orphans.length} orphan containers`);
            }
        } catch (error) {
            console.error("Failed to cleanup orphans:", error);
        }
    }

    /**
     * Stop all containers (for graceful shutdown)
     */
    async stopAll(): Promise<void> {
        console.log(`[ContainerService] Stopping all ${this.containers.size} containers...`);
        const stopPromises = Array.from(this.containers.entries()).map(async ([deploymentId, info]) => {
            try {
                const container = docker.getContainer(info.containerId);
                await container.stop();
                console.log(`[ContainerService] Stopped container: ${deploymentId}`);
            } catch (error) {
                console.error(`Failed to stop container ${deploymentId}:`, error);
            }
        });
        await Promise.all(stopPromises);
        this.containers.clear();
    }
}

export const containerService = new ContainerService();
