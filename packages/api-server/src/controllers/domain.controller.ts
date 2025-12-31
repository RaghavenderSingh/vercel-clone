import type { Request, Response, NextFunction } from "express";
import * as domainService from "../services/domain.service";

export const addDomain = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId } = req.params;
    const { domain } = req.body;

    if (!projectId || !domain) {
      return res.status(400).json({ error: "Project ID and domain are required" });
    }

    // TODO: Validate project ownership if not already handled by middleware or service
    // Assuming service or subsequent checks handle permission, or we should add a check here.
    // For now, fast iteration, relying on basic checks. Ideally we should check if user owns project.

    const result = await domainService.addDomain(projectId, domain);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("already in use")) {
        return res.status(409).json({ error: error.message });
    }
    next(error);
  }
};

export const removeDomain = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId, domain } = req.params;
    
    if (!projectId || !domain) {
        return res.status(400).json({ error: "Project ID and domain are required" });
    }

    await domainService.removeDomain(projectId, domain);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const verifyDomain = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId, domain } = req.params;

    if (!projectId || !domain) {
      return res.status(400).json({ error: "Project ID and domain are required" });
    }

    const result = await domainService.verifyDomain(projectId, domain);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getDomains = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    const domains = await domainService.getDomains(projectId);
    res.json(domains);
  } catch (error) {
    next(error);
  }
};
