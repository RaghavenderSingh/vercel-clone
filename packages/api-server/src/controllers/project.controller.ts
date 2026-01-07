import type { Request, Response, NextFunction } from "express";
import * as projectService from "../services/project.service";

export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const project = await projectService.createProject(userId, req.body);
    res.status(201).json(project);
  } catch (error) {
    if (error instanceof Error && error.message.includes("already been added")) {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
};

export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const projects = await projectService.getProjectsByUser(userId);
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

export const getProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId } = req.params;
    if (!projectId)
      return res.status(400).json({ error: "Project ID required" });

    const project = await projectService.getProjectById(projectId, userId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId } = req.params;
    if (!projectId)
      return res.status(400).json({ error: "Project ID required" });

    await projectService.deleteProject(projectId, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const updateBuildConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId } = req.params;
    if (!projectId)
      return res.status(400).json({ error: "Project ID required" });

    const config = await projectService.updateBuildConfig(
      projectId,
      userId,
      req.body
    );
    res.json(config);
  } catch (error) {
    next(error);
  }
};
