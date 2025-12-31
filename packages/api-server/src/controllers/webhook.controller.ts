import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { createDeployment } from "../services/deployment.service";
import type { GitHubWebhookPayload } from "../types";
import { prisma } from "@titan/db";

export const verifyGitHubSignature = (
  payload: string,
  signature: string
): boolean => {
  const secret = process.env.GITHUB_WEBHOOK_SECRET || "";
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

export const handleGitHubWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const signature = req.headers["x-hub-signature-256"] as string;
    const payload = JSON.stringify(req.body);

    if (!verifyGitHubSignature(payload, signature)) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const event = req.headers["x-github-event"];

    if (event === "push") {
      const data: GitHubWebhookPayload = req.body;

      const project = await prisma.project.findFirst({
        where: { repoUrl: data.repository.clone_url },
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const branch = data.ref.replace("refs/heads/", "");

      const deployment = await createDeployment(
        project.id,
        data.head_commit.id,
        branch,
        data.head_commit.message
      );

      return res.json({
        message: "Deployment triggered",
        deploymentId: deployment.id,
      });
    }

    res.json({ message: "Event received" });
  } catch (error) {
    next(error);
  }
};
