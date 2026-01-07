import { Request, Response } from "express";
import * as usageService from "../services/usage.service";
import { createLogger } from "@vercel-clone/shared";

const logger = createLogger('api-server');

export async function getUserUsage(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id as string;
    const usage = await usageService.getUserTotalUsage(userId);
    res.json(usage);
  } catch (error) {
    logger.error("Failed to fetch user usage", error as Error);
    res.status(500).json({ error: "Failed to fetch user usage" });
  }
}

export async function getProjectUsage(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id as string;
    const { projectId } = req.params;
    const usage = await usageService.getProjectUsage(projectId as string, userId);
    res.json(usage);
  } catch (error) {
    logger.error("Failed to fetch project usage", error as Error);
    res.status(500).json({ error: "Failed to fetch project usage" });
  }
}
