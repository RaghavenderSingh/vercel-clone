import { Request, Response, NextFunction } from "express";
import { prisma } from "@titan/db";

/**
 * Check if user owns the specified project
 */
export const checkProjectOwnership = async (
  projectId: string,
  userId: string
): Promise<void> => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.userId !== userId) {
    throw new Error("Unauthorized: You do not own this project");
  }
};

/**
 * Check if user owns the project associated with the deployment
 */
export const checkDeploymentOwnership = async (
  deploymentId: string,
  userId: string
): Promise<void> => {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    include: {
      project: {
        select: { userId: true },
      },
    },
  });

  if (!deployment) {
    throw new Error("Deployment not found");
  }

  if (deployment.project.userId !== userId) {
    throw new Error("Unauthorized: You do not own this deployment");
  }
};

/**
 * Middleware to verify project ownership before proceeding
 */
export const requireProjectOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.id || req.params.projectId || req.body.projectId;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!projectId) {
      return res.status(400).json({ error: "Project ID required" });
    }

    await checkProjectOwnership(projectId, userId);
    next();
  } catch (error) {
    if (error instanceof Error) {
      const status = error.message.includes("not found") ? 404 : 403;
      return res.status(status).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * Middleware to verify deployment ownership before proceeding
 */
export const requireDeploymentOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const deploymentId = req.params.id || req.params.deploymentId || req.body.deploymentId;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!deploymentId) {
      return res.status(400).json({ error: "Deployment ID required" });
    }

    await checkDeploymentOwnership(deploymentId, userId);
    next();
  } catch (error) {
    if (error instanceof Error) {
      const status = error.message.includes("not found") ? 404 : 403;
      return res.status(status).json({ error: error.message });
    }
    next(error);
  }
};
