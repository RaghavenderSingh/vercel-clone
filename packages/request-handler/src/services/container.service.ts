import Docker from "dockerode";
import path from "path";
import getPort from "get-port";
import { createLogger } from "@vercel-clone/shared";

const logger = createLogger('request-handler');
const docker = new Docker({ socketPath: process.env.DOCKER_SOCKET_PATH || "/var/run/docker.sock" });

interface ContainerInfo {
    containerId: string;
    port: number;
    lastAccess: number;
}

export class ContainerService {
    private containers: Map<string, ContainerInfo> = new Map();

    async getPort(deploymentId: string, s3Key: string | null, localPath: string): Promise<number> {
        // 1. Check if running
        if (this.containers.has(deploymentId)) {
            const info = this.containers.get(deploymentId)!;
            // Check if actually alive
            try {
                const container = docker.getContainer(info.containerId);
                const state = await container.inspect();
                if (state.State.Running) {
                    // Update last access time
                    info.lastAccess = Date.now();
                    return info.port;
                }
            } catch (e) {
                // Container died or gone
                this.containers.delete(deploymentId);
            }
        }

        // 2. Start new container
        const port = await getPort();
        logger.container.start('', deploymentId, { port });

        let container;

        if (s3Key && s3Key.startsWith("docker:")) {
            // Scenario A: Custom Docker Image
            const imageName = s3Key.replace("docker:", "");
            logger.info('Booting custom Docker image', { deploymentId, imageName });

            container = await docker.createContainer({
                Image: imageName,
                Tty: false,
                ExposedPorts: {
                    "3000/tcp": {}
                },
                HostConfig: {
                    PortBindings: {
                        "3000/tcp": [{ HostPort: String(port) }]
                    },
                    AutoRemove: true,
                    Memory: 512 * 1024 * 1024,        // 512MB
                    MemorySwap: 512 * 1024 * 1024,    // No swap
                    NanoCpus: 1000000000,              // 1 CPU
                    PidsLimit: 100,                    // Max 100 processes
                    SecurityOpt: ["no-new-privileges"]
                }
            });

        } else {
            // Scenario B: Standard Node (Legacy) - Mount local path
            logger.info('Booting standard Node.js runtime', { deploymentId, localPath });
            const absolutePath = path.resolve(localPath);

            // Detect start command - prioritize server.js for Next.js standalone builds
            let startCommand = ["node", "server.js"]; // Default for Next.js standalone
            try {
                const serverJsPath = path.join(localPath, "server.js");
                const packageJsonPath = path.join(localPath, "package.json");

                // Check if server.js exists (Next.js standalone mode)
                if (require("fs").existsSync(serverJsPath)) {
                    startCommand = ["node", "server.js"];
                    logger.debug('Using Next.js standalone mode', { deploymentId, command: 'node server.js' });
                } else {
                    // Fall back to package.json scripts
                    const packageJson = JSON.parse(require("fs").readFileSync(packageJsonPath, "utf-8"));

                    if (packageJson.scripts?.start) {
                        // Use npm start (safe since it's from package.json, not user input)
                        startCommand = ["npm", "start"];
                        logger.debug('Using package.json start script', { deploymentId, command: 'npm start' });
                    } else if (packageJson.main) {
                        // Use the main entry point
                        startCommand = ["node", packageJson.main];
                        logger.debug('Using package.json main entry', { deploymentId, main: packageJson.main });
                    }
                }
            } catch (error) {
                logger.warn('Could not detect start command, using default', { deploymentId, defaultCommand: 'node server.js' });
            }

            container = await docker.createContainer({
                Image: "node:20-alpine",
                Cmd: startCommand,
                WorkingDir: "/app",
                Tty: false,
                ExposedPorts: {
                    "3000/tcp": {} // Next.js standalone listens on 3000
                },
                HostConfig: {
                    Binds: [`${absolutePath}:/app`],
                    PortBindings: {
                        "3000/tcp": [{ HostPort: String(port) }]
                    },
                    AutoRemove: true,
                    Memory: 512 * 1024 * 1024,        // 512MB
                    MemorySwap: 512 * 1024 * 1024,    // No swap
                    NanoCpus: 1000000000,              // 1 CPU
                    PidsLimit: 100,                    // Max 100 processes
                    SecurityOpt: ["no-new-privileges"]
                },
                Env: [
                    "PORT=3000",
                    "HOSTNAME=0.0.0.0"
                ]
            });
        }

        await container.start();

        // Wait for container to be healthy (proper health checking)
        await this.waitForHealthy(port, 30000);

        this.containers.set(deploymentId, {
            containerId: container.id,
            port,
            lastAccess: Date.now()
        });
        return port;
    }

    /**
     * Wait for container to become healthy by polling its port
     */
    private async waitForHealthy(port: number, timeout: number = 30000): Promise<void> {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            try {
                const response = await fetch(`http://127.0.0.1:${port}/`, {
                    signal: AbortSignal.timeout(1000)
                });
                // If we get any response (even 404), the server is running
                if (response.ok || response.status === 404) {
                    logger.info('Container healthy', { deploymentId, port });
                    return;
                }
            } catch (e) {
                // Not ready yet, continue polling
            }
            await new Promise(r => setTimeout(r, 200)); // Poll every 200ms
        }
        throw new Error(`Container failed to become healthy within ${timeout}ms`);
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
                // Only cleanup containers with titan- prefix not in our registry
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
