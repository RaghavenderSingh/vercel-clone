import AWS from "aws-sdk";
import Docker from "dockerode";
import path from "path";
import fs from "fs/promises";
import simpleGit from "simple-git";
import { prisma } from "@titan/db";
import type { BuildJob } from "../types";
import { DeploymentStatus } from "../types";
import { uploadDirectory } from "./s3.service";
import { io } from "socket.io-client";
import AdmZip from "adm-zip";
import { validateCommand, validateArguments, filterEnvironmentVariables } from "../lib/command-sanitizer";
import { createLogger } from "@vercel-clone/shared";
import { aiFixerService } from "./ai-fixer.service";

const logger = createLogger('build-worker');

const socket = io(process.env.API_URL || "http://localhost:3000");
const docker = new Docker({ socketPath: process.env.DOCKER_SOCKET_PATH || "/var/run/docker.sock" });

const CONTAINER_BUILD_BASE = "/tmp/builds";
const HOST_BUILD_BASE = process.env.HOST_BUILD_PATH || "/tmp/builds";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Runs a command inside a Docker container mounting the build path.
 * SECURITY: Commands are validated and executed without shell to prevent injection.
 */
async function runCommandInContainer(
  command: string,
  args: string[],
  deploymentId: string,
  containerBuildPath: string,
  hostBuildPath: string,
  userEnvVars: Record<string, string> = {}
): Promise<void> {
  const image = "node:20-alpine";

  validateCommand(command);
  validateArguments(args);

  const fullCommand = [command, ...args];
  const cmdString = fullCommand.join(" ");

  emitLog(deploymentId, `🐳 Starting container (${image}) for: ${cmdString}`);

  const defaultEnv = {
    NPM_CONFIG_LOGLEVEL: 'warn',
    PATH: '/usr/local/bin:/usr/bin:/bin',
    HOME: '/root',
  };
  const safeEnv = filterEnvironmentVariables(defaultEnv, userEnvVars);

  try {
    const container = await docker.createContainer({
      Image: image,
      Cmd: fullCommand,
      Tty: false,
      Env: safeEnv,
      WorkingDir: "/app",
      HostConfig: {
        Binds: [`${hostBuildPath}:/app`],
        AutoRemove: true,
      },
    });

    await container.start();

    const stream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
    });

    const streamPromise = new Promise<void>((resolve) => {
      container.modem.demuxStream(
        stream,
        {
          write: (chunk: Buffer) => {
            const log = chunk.toString();
            logger.debug('Container stdout', { deploymentId, log: logsToString(log) });
            emitLog(deploymentId, logsToString(log));
          },
        },
        {
          write: (chunk: Buffer) => {
            const log = chunk.toString();
            logger.debug('Container stderr', { deploymentId, log: logsToString(log) });
            emitLog(deploymentId, logsToString(log));
          },
        }
      );
      stream.on('end', resolve);
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Build timed out after 15 minutes')), 15 * 60 * 1000);
    });

    const [result] = await Promise.race([
      Promise.all([container.wait(), streamPromise]),
      timeoutPromise
    ]);

    if (result.StatusCode !== 0) {
      throw new Error(`Command failed with exit code ${result.StatusCode}`);
    }
  } catch (error) {
    throw new Error(`Container execution failed: ${getErrorMessage(error)}`);
  }
}

/**
 * Helper to clean up log output
 */
function logsToString(log: string | Buffer): string {
    return log.toString().replace(/\x00/g, '');
}



/**
 * Pushes the built image to AWS ECR
 */
async function pushToECR(deploymentId: string, localImageName: string): Promise<string> {
    const ecrRepoUrl = process.env.ECR_REPOSITORY_URL;
    
    if (!ecrRepoUrl) {
         emitLog(deploymentId, "⚠️ ECR_REPOSITORY_URL not set - skipping push to registry.");
         return localImageName;
    }

    emitLog(deploymentId, "🔐 Authenticating with ECR...");

    const ecr = new AWS.ECR({
        region: process.env.AWS_REGION || "us-east-1",
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    try {
        const authData = await ecr.getAuthorizationToken({}).promise();
        const authToken = authData.authorizationData?.[0]?.authorizationToken;
        const proxyEndpoint = authData.authorizationData?.[0]?.proxyEndpoint;

        if (!authToken || !proxyEndpoint) {
            throw new Error("Failed to retrieve ECR authorization token");
        }

        const decodedToken = Buffer.from(authToken, 'base64').toString('utf-8');
        const [username, password] = decodedToken.split(':');

        const remoteImageName = `${ecrRepoUrl}:${deploymentId}`;

        const image = docker.getImage(localImageName);
        await image.tag({ repo: ecrRepoUrl, tag: deploymentId });

        emitLog(deploymentId, `🚀 Pushing image to ECR: ${remoteImageName}...`);

        const pushImage = docker.getImage(remoteImageName);
        const stream = await pushImage.push({
            authconfig: {
                username,
                password,
                serveraddress: proxyEndpoint,
            }
        });

        await new Promise((resolve, reject) => {
            docker.modem.followProgress(
                stream,
                (err, res) => err ? reject(err) : resolve(res),
                (event) => {
                    if (event.status) {
                         logger.debug('Docker push progress', { deploymentId, status: event.status });
                    }
                    if (event.error) {
                         emitLog(deploymentId, `❌ Push failed: ${event.error}`);
                    }
                }
            );
        });

        emitLog(deploymentId, `✅ Successfully pushed to ECR: ${remoteImageName}`);
        return remoteImageName;

    } catch (error) {
        throw new Error(`ECR Push failed: ${getErrorMessage(error)}`);
    }
}

/**
 * Builds a user-provided Dockerfile
 */
async function buildUserImage(deploymentId: string, buildPath: string) {
    const imageName = `titan-${deploymentId}:latest`;
    emitLog(deploymentId, `🐳 Dockerfile detected. Building image: ${imageName}...`);
    
    try {
        const stream = await docker.buildImage({
            context: buildPath,
            src: ['.']
        }, {
            t: imageName,
        });

        await new Promise((resolve, reject) => {
            docker.modem.followProgress(
                stream, 
                (err, res) => err ? reject(err) : resolve(res),
                (event) => {
                    if (event.stream) {
                        const log = event.stream.trim();
                        if (log) {
                             logger.debug('Docker build progress', { deploymentId, log });
                             emitLog(deploymentId, log);
                        }
                    }
                    if (event.error) {
                        logger.error('Docker build error', new Error(event.error), { deploymentId });
                        emitLog(deploymentId, `❌ ${event.error}`);
                    }
                }
            );
        });

        emitLog(deploymentId, `✅ Docker build completed: ${imageName}`);
        
        const finalImageRef = await pushToECR(deploymentId, imageName);
        
        await prisma.deployment.update({
            where: { id: deploymentId },
            data: { s3Key: `docker:${finalImageRef}` },
        });

        
    } catch (error) {
         throw new Error(`Docker build failed: ${getErrorMessage(error)}`);
    }
}

const buildLogsMap = new Map<string, string[]>();

export async function processBuild(job: BuildJob) {
  buildLogsMap.set(job.deploymentId, []);
  
  const buildPath = path.join(CONTAINER_BUILD_BASE, job.deploymentId);
  const hostBuildPath = path.join(HOST_BUILD_BASE, job.deploymentId);

  try {
    await updateStatus(job.deploymentId, DeploymentStatus.BUILDING);

    if (job.sourceType === 'zip' && job.zipPath) {
        await extractZip(job.deploymentId, job.zipPath, buildPath);
    } else {
        await cloneRepo(job.deploymentId, job.repoUrl, job.branch, buildPath);
    }

    const dockerfilePath = path.join(buildPath, "Dockerfile");
    const hasDockerfile = await fs.stat(dockerfilePath).then(() => true).catch(() => false);

    if (hasDockerfile) {
        // --- UNIVERSAL BUILD FLOW ---
        await buildUserImage(job.deploymentId, buildPath);
        
        await updateStatus(
            job.deploymentId, 
            DeploymentStatus.READY, 
            "Docker build completed successfully"
        );
    } else {
        // --- STANDARD NODE.JS FLOW ---
        await installDependencies(job.deploymentId, job.installCommand, buildPath, hostBuildPath);

        await configureProject(job.deploymentId, buildPath);

        await runBuild(job.deploymentId, job.buildCommand, buildPath, hostBuildPath, job.envVars);

        const outputDir = await detectOutputDirectory(buildPath);
        emitLog(job.deploymentId, `Uploading to S3...`);
        await uploadToS3(buildPath, outputDir, job.deploymentId);
        emitLog(job.deploymentId, `Upload complete!`);

        await updateStatus(
            job.deploymentId,
            DeploymentStatus.READY,
            "Build completed successfully"
        );
    }

  } catch (error) {
    const errorMessage = getErrorMessage(error);
    logger.build.fail(job.deploymentId, error instanceof Error ? error : new Error(errorMessage));
    emitLog(job.deploymentId, `Build failed: ${errorMessage}`);

    await updateStatus(
      job.deploymentId,
      DeploymentStatus.ERROR,
      `Build failed: ${errorMessage}`
    );

    if (aiFixerService.isAIEnabled()) {
      emitLog(job.deploymentId, `🤖 Analyzing error with AI...`);
      aiFixerService.analyzeBuildError(job.deploymentId, errorMessage, job).catch((aiError) => {
        logger.warn('AI analysis failed (non-critical)', {
          deploymentId: job.deploymentId,
          error: aiError instanceof Error ? aiError.message : String(aiError),
        });
      });
    }
  } finally {
    await cleanup(buildPath);
    buildLogsMap.delete(job.deploymentId);
  }
}

async function extractZip(deploymentId: string, zipPath: string, buildPath: string) {
    logger.info('Extracting zip file', { deploymentId, zipPath, buildPath });
    emitLog(deploymentId, `Validating zip file...`);

    const { validateZip } = await import("../lib/zip-validator");
    const validation = validateZip(zipPath);

    if (!validation.valid) {
        throw new Error(`Invalid zip file: ${validation.error}`);
    }

    if (validation.stats) {
        emitLog(
            deploymentId,
            `Zip validated: ${validation.stats.fileCount} files, ` +
            `${(validation.stats.uncompressedSize / (1024 * 1024)).toFixed(2)}MB uncompressed`
        );
    }

    emitLog(deploymentId, `Extracting source code...`);
    await fs.mkdir(buildPath, { recursive: true });

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(buildPath, true);

    logger.info('Zip extraction successful', { deploymentId, buildPath });
    emitLog(deploymentId, "Source code extracted successfully");
}

async function cloneRepo(
  deploymentId: string,
  repoUrl: string,
  branch: string,
  buildPath: string
) {
  logger.info('Cloning repository', { deploymentId, repoUrl, branch });
  emitLog(deploymentId, `Cloning repository from ${branch} branch...`);

  await fs.mkdir(buildPath, { recursive: true });

  const git = simpleGit();
  await git.clone(repoUrl, buildPath, ["--branch", branch, "--depth", "1"]);

  logger.info('Repository cloned successfully', { deploymentId, buildPath });
  emitLog(deploymentId, "Repository cloned successfully");
}

async function installDependencies(
  deploymentId: string,
  installCommand: string,
  buildPath: string,
  hostBuildPath: string
) {
  logger.info('Installing dependencies', { deploymentId, installCommand });
  emitLog(deploymentId, `Installing dependencies: ${installCommand}\n`);

  const parts = installCommand.split(" ");
  const command = parts[0];
  const args = parts.slice(1);

  await runCommandInContainer(
    command,
    args,
    deploymentId,
    buildPath,
    hostBuildPath,
    {}
  );

  logger.info('Dependencies installed successfully', { deploymentId });
  emitLog(deploymentId, "\n✓ Dependencies installed successfully\n");
}

async function runBuild(
  deploymentId: string,
  buildCommand: string,
  buildPath: string,
  hostBuildPath: string,
  envVars?: Record<string, string>
) {
  const packageJsonPath = path.join(buildPath, "package.json");
  let hasBuildScript = false;

  try {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
    const scriptName = buildCommand.replace(/^(npm|yarn|pnpm|bun)\s+(run\s+)?/, "");
    hasBuildScript = packageJson.scripts && packageJson.scripts[scriptName];

    if (!hasBuildScript) {
      logger.warn('Build script not found, skipping build', { deploymentId, scriptName });
      emitLog(deploymentId, `\n⚠️  No "${scriptName}" script found - skipping build step\n`);
      emitLog(deploymentId, `📦 Project will be deployed as-is (source code)\n`);
      return;
    }
  } catch (error) {
    logger.warn('Could not read package.json, attempting build anyway', { deploymentId, error });
  }

  logger.info('Running build command', { deploymentId, buildCommand });
  emitLog(deploymentId, `\nBuilding: ${buildCommand}\n`);

  if (envVars) {
    const keys = Object.keys(envVars);
    logger.debug('Environment variables available', { deploymentId, envVars: keys });
    emitLog(deploymentId, `Environment Variables injected: ${keys.join(", ")}\n`);
  } else {
    emitLog(deploymentId, "No Environment Variables injected.\n");
  }

  const parts = buildCommand.split(" ");
  const command = parts[0];
  const args = parts.slice(1);

  await runCommandInContainer(
    command,
    args,
    deploymentId,
    buildPath,
    hostBuildPath,
    envVars || {}
  );

  logger.info('Build completed successfully', { deploymentId });
  emitLog(deploymentId, "\n✓ Build completed successfully\n");
}

async function detectOutputDirectory(buildPath: string): Promise<string> {
  const possibleDirs = [
    ".next/standalone",
    "out",
    "dist",
    "build",
    ".next",
    "public",
  ];

  for (const dir of possibleDirs) {
    const fullPath = path.join(buildPath, dir);
    try {
      await fs.stat(fullPath);
      logger.info('Detected output directory', { dir, fullPath });
      return dir;
    } catch {
      continue;
    }
  }

  logger.info('No build output detected - deploying source code', { buildPath });
  return ".";
}

async function uploadToS3(
  buildPath: string,
  outputDir: string,
  deploymentId: string
) {
  const outputPath = path.join(buildPath, outputDir);
  const s3Prefix = `deployments/${deploymentId}`;

  logger.info('Uploading to S3', { deploymentId, outputPath, s3Prefix });

  if (outputDir === ".next/standalone") {
    emitLog(deploymentId, "Preparing Next.js standalone build...");

    const staticSrc = path.join(buildPath, ".next/static");
    const staticDest = path.join(outputPath, ".next/static");
    if (await fileExists(staticSrc)) {
      await fs.cp(staticSrc, staticDest, { recursive: true });
      emitLog(deploymentId, "Copied .next/static to standalone directory");
    }

    const publicSrc = path.join(buildPath, "public");
    const publicDest = path.join(outputPath, "public");
    if (await fileExists(publicSrc)) {
      await fs.cp(publicSrc, publicDest, { recursive: true });
      emitLog(deploymentId, "Copied public directory to standalone");
    }
  }

  await uploadDirectory(outputPath, s3Prefix);

  await prisma.deployment.update({
    where: { id: deploymentId },
    data: { s3Key: s3Prefix },
  });
}

async function updateStatus(
  deploymentId: string,
  status: DeploymentStatus,
  logs?: string
) {
  const currentLogs = buildLogsMap.get(deploymentId) || [];
  const fullLogs = currentLogs.join('\n');

  await prisma.deployment.update({
    where: { id: deploymentId },
    data: {
      status,
      buildLogs: fullLogs,
      updatedAt: new Date(),
    },
  });

  socket.emit("deployment-update", {
    deploymentId,
    status,
    logs: fullLogs,
    timestamp: new Date().toISOString(),
  });
}
function emitLog(deploymentId: string, log: string) {
  const currentLogs = buildLogsMap.get(deploymentId) || [];
  currentLogs.push(log);
  buildLogsMap.set(deploymentId, currentLogs);

  socket.emit("deployment-log", {
    deploymentId,
    log,
    timestamp: new Date().toISOString(),
  });
}

async function cleanup(buildPath: string) {
  try {
    await fs.rm(buildPath, { recursive: true, force: true });
    logger.debug('Cleanup completed', { buildPath });
  } catch (error) {
    logger.error('Cleanup failed', error instanceof Error ? error : new Error(String(error)), { buildPath });
  }
}

async function configureProject(deploymentId: string, buildPath: string) {
  try {
    const packageJsonPath = path.join(buildPath, "package.json");
    if (
      !(await fs
        .stat(packageJsonPath)
        .then(() => true)
        .catch(() => false))
    ) {
      return; 
    }

    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    if (dependencies["next"]) {
      emitLog(deploymentId, "Detected Next.js project. Configuring...");
      const configPath = path.join(buildPath, "next.config.js");
      const configMjsPath = path.join(buildPath, "next.config.mjs");

      if (await fileExists(configPath)) {
        let configContent = await fs.readFile(configPath, "utf-8");
        if (!configContent.includes("output:")) {
            if (configContent.includes("module.exports = {")) {
                 configContent = configContent.replace("module.exports = {", "module.exports = { output: 'standalone', ");
                 await fs.writeFile(configPath, configContent);
                 emitLog(deploymentId, "Patched next.config.js with output: 'standalone'");
            } else if (configContent.includes("const nextConfig = {")) {
                 configContent = configContent.replace("const nextConfig = {", "const nextConfig = { output: 'standalone', ");
                 await fs.writeFile(configPath, configContent);
                 emitLog(deploymentId, "Patched next.config.js with output: 'standalone'");
            } else {
                 emitLog(deploymentId, "⚠️ Could not auto-patch next.config.js. Please ensure output: 'standalone' is set.");
            }
        }
      } else if (await fileExists(configMjsPath)) {
         let configContent = await fs.readFile(configMjsPath, "utf-8");
         if (!configContent.includes("output:")) {
           if (configContent.includes("const nextConfig = {")) {
                configContent = configContent.replace("const nextConfig = {", "const nextConfig = { output: 'standalone', ");
                await fs.writeFile(configMjsPath, configContent);
                emitLog(deploymentId, "Patched next.config.mjs with output: 'standalone'");
           } else {
                emitLog(deploymentId, "⚠️ Could not auto-patch next.config.mjs. Please ensure output: 'standalone' is set.");
           }
        }
      } else {
        const configContent = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
};

module.exports = nextConfig;
`;
        await fs.writeFile(configPath, configContent);
        emitLog(deploymentId, "Created next.config.js with output: 'standalone'");
      }
    }
  } catch (error) {
    logger.warn('Failed to configure project', { deploymentId, error });
    emitLog(deploymentId, "⚠️ Auto-configuration failed, proceeding with build...");
  }
}

async function fileExists(path: string) {
    return fs.stat(path).then(() => true).catch(() => false);
}
