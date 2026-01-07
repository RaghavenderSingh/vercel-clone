import { prisma } from "@titan/db";
import { DeploymentStatus, type BuildJob } from "../types";
import { addBuildJob, removeJob } from "./queue.service";
import * as activityService from "./activity.service";

export async function createDeployment(
  projectId: string,
  commitSha: string,
  branch: string,
  commitMessage?: string
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { buildConfig: true },
  });
  if (!project) throw new Error("Project not found");

  const deployment = await prisma.deployment.create({
    data: {
      projectId,
      commitSha,
      branch,
      commitMessage,
      status: DeploymentStatus.QUEUED,
      deploymentUrl: "",    },
  });

  const requestHandlerDomain = process.env.REQUEST_HANDLER_DOMAIN || "titan.curiousdev.xyz";
  const protocol = process.env.ID_PROTOCOL || "http";
  const updatedDeployment = await prisma.deployment.update({
    where: { id: deployment.id },
    data: {
      deploymentUrl: `${protocol}://${deployment.id}.${requestHandlerDomain}`,
    },
  });
  const buildJob: BuildJob = {
    deploymentId: deployment.id,
    projectId: project.id,
    repoUrl: project.repoUrl,
    commitSha,
    branch,
    buildCommand: project.buildConfig?.buildCommand || "npm run build",
    installCommand: project.buildConfig?.installCommand || "npm install",
    envVars: project.buildConfig?.envVars as Record<string, string>,
  };
  await addBuildJob(buildJob);

  await activityService.createActivity({
    type: "deployment",
    action: "deployed",
    target: project.name,
    metadata: `${branch} (${commitSha.slice(0, 7)})`,
    userId: project.userId,
    projectId: project.id,
  });

  return updatedDeployment;
}

export async function getDeploymentById(deploymentId: string) {
  return prisma.deployment.findUnique({
    where: { id: deploymentId },
    include: {
      project: {
        include: { buildConfig: true },
      },
    },
  });
}

export async function getDeploymentsByProject(projectId: string) {
  return prisma.deployment.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDeploymentsByUser(userId: string) {
  return prisma.deployment.findMany({
    where: {
      project: {
        userId: userId,
      },
    },
    include: {
      project: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateDeploymentStatus(
  deploymentId: string,
  status: DeploymentStatus,
  logs?: string,
  error?: string
) {
  return prisma.deployment.update({
    where: { id: deploymentId },
    data: {
      status,
      buildLogs: logs,
      errorMessage: error,
      updatedAt: new Date(),
    },
  });
}

export async function cancelDeployment(deploymentId: string) {
  await removeJob(deploymentId);

  return prisma.deployment.update({
    where: { id: deploymentId },
    data: {
      status: DeploymentStatus.ERROR,
      errorMessage: "Cancelled by user",
    },
  });
}
