import { Request, Response } from "express";
import * as activityService from "../services/activity.service";
import { createLogger } from "@vercel-clone/shared";

const logger = createLogger('api-server');

export async function getActivities(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id as string;
    const activities = await activityService.getActivities(userId);
    res.json(activities);
  } catch (error) {
    logger.error("Failed to fetch activities", error as Error);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
}

export async function getProjectActivities(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id as string;
    const { projectId } = req.params;
    const activities = await activityService.getProjectActivities(projectId as string, userId);
    res.json(activities);
  } catch (error) {
    logger.error("Failed to fetch project activities", error as Error);
    res.status(500).json({ error: "Failed to fetch project activities" });
  }
}
