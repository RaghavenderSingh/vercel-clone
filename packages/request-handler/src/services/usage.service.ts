import { prisma } from "@titan/db";
import { createLogger } from "@vercel-clone/shared";

const logger = createLogger('request-handler');

export class UsageService {
  /**
   * Logs a request with its basic metrics.
   * In a high-traffic environment, this should ideally be buffered in Redis
   * and flushed to the DB in batches. For Titan MVP, we'll do direct upserts.
   */
  async logRequest(projectId: string, bytes: number = 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      await prisma.projectUsage.upsert({
        where: {
          projectId_date: {
            projectId,
            date: today,
          },
        },
        update: {
          requests: { increment: 1 },
          bandwidth: { increment: BigInt(bytes) },
          invocations: { increment: 1 },
        },
        create: {
          projectId,
          date: today,
          requests: 1,
          bandwidth: BigInt(bytes),
          invocations: 1,
        },
      });
    } catch (error) {
      logger.error('Failed to log project usage', error instanceof Error ? error : new Error(String(error)), { projectId });
    }
  }
}

export const usageService = new UsageService();
