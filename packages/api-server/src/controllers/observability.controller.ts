import { Request, Response } from "express";
import * as obsService from "../services/observability.service";
import { createLogger } from "@vercel-clone/shared";

const logger = createLogger('api-server');

export async function getProjectMetrics(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id as string;
    const { projectId } = req.params;
    const metrics = await obsService.getProjectMetrics(projectId as string, userId);
    res.json(metrics);
  } catch (error) {
    logger.error("Failed to fetch project metrics", error as Error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
}

export async function getDeploymentLogs(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id as string;
    const { deploymentId } = req.params;
    const logs = await obsService.getDeploymentLogs(deploymentId as string, userId);
    res.json(logs);
  } catch (error) {
    logger.error("Failed to fetch deployment logs", error as Error);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
}
