import { prisma } from "@titan/db";
import type { createProjectDto } from "../types";
import { createDeployment } from "./deployment.service";
import * as activityService from "./activity.service";
import { createLogger } from "@vercel-clone/shared";

const logger = createLogger('api-server');

export async function createProject(userId: string, data: createProjectDto) {
  const existingProject = await prisma.project.findFirst({
    where: {
      userId,
      repoUrl: data.repoUrl,
    },
  });

  if (existingProject) {
    throw new Error("This repository has already been added to your projects");
  }

  const project = await prisma.project.create({
    data: {
      name: data.name,
      repoUrl: data.repoUrl,
      framework: data.framework,
      userId,
      buildConfig: {
        create: {
          buildCommand: data.buildCommand || "npm run build",
          installCommand: data.installCommand || "npm install",
          envVars: data.envVars || {},
        },
      },
    },
    include: {
      buildConfig: true,
    },
  });

  await activityService.createActivity({
    type: "project",
    action: "created",
    target: project.name,
    metadata: project.framework,
    userId,
    projectId: project.id,
  });

  if (data.defaultBranch) {
    try {
        await createDeployment(project.id, "initial-import", data.defaultBranch, "Initial import");
    } catch (error) {
        logger.error("Failed to trigger initial deployment", error instanceof Error ? error : new Error(String(error)), {
          projectId: project.id,
          defaultBranch: data.defaultBranch
        });
    }
  }

  return project;
}

export async function getProjectsByUser(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    include: {
      deployments: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      buildConfig: true,
    },
  });
}

export async function getProjectById(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, userId },
    include: {
      buildConfig: true,
      deployments: {
        orderBy: { createdAt: "desc" },
      },
      domains: true,
    },
  });
}

export async function deleteProject(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({ 
    where: { id: projectId, userId } 
  });
  
  if (!project) {
    throw new Error("Project not found or unauthorized");
  }
  
  const result = await prisma.project.delete({
    where: { id: projectId },
  });

  await activityService.createActivity({
    type: "project",
    action: "deleted",
    target: project.name,
    userId,
  });

  return result;
}

export async function updateBuildConfig(
  projectId: string,
  userId: string,
  config: Partial<createProjectDto>
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw new Error("Project not found");

  return prisma.buildConfig.update({
    where: { projectId },
    data: {
      buildCommand: config.buildCommand,
      installCommand: config.installCommand,
      envVars: config.envVars,
    },
  });
}
