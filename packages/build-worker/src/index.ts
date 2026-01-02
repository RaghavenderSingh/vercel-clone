import dotenv from "dotenv";
dotenv.config();

import { Worker } from "bullmq";
import Redis from "ioredis";
import { processBuild } from "./services/build.service";
import type { BuildJob } from "./types";
import { createLogger } from "@vercel-clone/shared";

const logger = createLogger('build-worker');

const connection = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
  }
);

const worker = new Worker(
  "build-queue",
  async (job) => {
    const buildJob: BuildJob = job.data;

    logger.build.start(buildJob.deploymentId, buildJob.buildCommand, {
      jobId: job.id,
      projectId: buildJob.projectId,
      repoUrl: buildJob.repoUrl,
      branch: buildJob.branch,
      sourceType: buildJob.sourceType
    });

    const startTime = Date.now();

    try {
      await processBuild(buildJob);
      const duration = Date.now() - startTime;
      logger.build.complete(buildJob.deploymentId, duration, { jobId: job.id });
    } catch (error) {
      logger.build.fail(buildJob.deploymentId, error instanceof Error ? error : String(error), { jobId: job.id });
      throw error;
    }
  },
  {
    connection,
    concurrency: 2,
  }
);

worker.on("completed", (job) => {
  logger.info('Build job completed', { jobId: job.id });
});

worker.on("failed", (job, err) => {
  logger.error('Build job failed', err, { jobId: job?.id });
});

logger.info('Build Worker started', {
  queueName: 'build-queue',
  concurrency: 2,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379'
});
