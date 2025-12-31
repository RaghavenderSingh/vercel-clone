import type { Request, Response, NextFunction } from "express";
import {
  cancelDeployment,
  createDeployment,
  getDeploymentById,
  getDeploymentsByProject,
  getDeploymentsByUser,
} from "../services/deployment.service";
import { prisma } from "@titan/db";
import { addBuildJob } from "../services/queue.service";
import { checkDeploymentOwnership, checkProjectOwnership } from "../middleware/authorize";
import path from "path";
import fs from "fs";

export const deployProject = async (
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    try {
        const file = req.file;
        const { projectName } = req.body;
        const userId = (req as any).user.id;

        if (!file) {
             return res.status(400).json({ error: "No zip file provided" });
        }
        
        // 1. Find or Create Project
        let project = await prisma.project.findFirst({
            where: { name: projectName, userId }
        });
        
        if (!project) {
             project = await prisma.project.create({
                 data: {
                     name: projectName,
                     userId,
                     repoUrl: "", // Empty for zip uploads
                     framework: "unknown"
                 }
             });
        }
        
        // 2. Create Deployment Record
        const deployment = await prisma.deployment.create({
            data: {
                projectId: project.id,
                status: "QUEUED",
                commitSha: "zip-upload",
                branch: "main" // Default
            }
        });
        
        // 3. Move Zip to "S3" (Local Mock)
        // We will store it in /tmp/uploads/<deploymentId>.zip
        // In prod, this would be key: deployments/<id>/source.zip
        const uploadDir = "/tmp/uploads";
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        
        const targetPath = path.join(uploadDir, `${deployment.id}.zip`);
        fs.renameSync(file.path, targetPath);
        
        // 4. Queue Build
        await addBuildJob({
            deploymentId: deployment.id,
            repoUrl: "", 
            branch: "",
            buildCommand: "npm run build", // Default, user can override but we use defaults for now
            installCommand: "npm install",
            envVars: {},
            sourceType: "zip", // <--- NEW FIELD
            zipPath: targetPath // <--- NEW FIELD
        });

        const requestHandlerDomain = process.env.REQUEST_HANDLER_DOMAIN || "localhost:3001";
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

        res.status(201).json({
            deploymentId: deployment.id,
            projectUrl: `${protocol}://${deployment.id}.${requestHandlerDomain}`
        });
        
    } catch (error) {
        next(error);
    }
};

export const createDeployments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId, commitSha, branch, commitMessage } = req.body;
    const userId = (req as any).user?.id;

    if (!projectId || !commitSha || !branch) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check project ownership before creating deployment
    await checkProjectOwnership(projectId, userId);

    const deployment = await createDeployment(
      projectId,
      commitSha,
      branch,
      commitMessage
    );
    res.status(201).json(deployment);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return res.status(403).json({ error: error.message });
    }
    next(error);
  }
};

export const getDeployment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { deploymentId } = req.params;
    const userId = (req as any).user?.id;

    if (!deploymentId) {
      return res.status(400).json({ error: "Deployment ID required" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check ownership before returning deployment
    await checkDeploymentOwnership(deploymentId, userId);

    const deployment = await getDeploymentById(deploymentId);
    if (!deployment) {
      return res.status(404).json({ error: "Deployment not found" });
    }
    res.json(deployment);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return res.status(403).json({ error: error.message });
    }
    next(error);
  }
};

export const getDeploymentByProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user?.id;

    if (!projectId) {
      return res.status(400).json({ error: "Project ID required" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check project ownership before returning deployments
    await checkProjectOwnership(projectId, userId);

    const deployments = await getDeploymentsByProject(projectId);
    res.json(deployments);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return res.status(403).json({ error: error.message });
    }
    next(error);
  }
};

export const cancelDeployments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { deploymentId } = req.params;
    const userId = (req as any).user?.id;

    if (!deploymentId) {
      return res.status(400).json({ error: "Deployment ID required" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check ownership before canceling deployment
    await checkDeploymentOwnership(deploymentId, userId);

    const deployment = await cancelDeployment(deploymentId);
    res.json(deployment);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return res.status(403).json({ error: error.message });
    }
    next(error);
  }
};

export const listDeployments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const deployments = await getDeploymentsByUser(userId);
    res.json(deployments);
  } catch (error) {
    next(error);
  }
};
