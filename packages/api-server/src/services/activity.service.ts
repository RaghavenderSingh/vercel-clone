import { prisma } from "@titan/db";

export async function createActivity(data: {
  type: string;
  action: string;
  target: string;
  metadata?: string;
  userId: string;
  projectId?: string;
}) {
  return prisma.activity.create({
    data: {
      type: data.type,
      action: data.action,
      target: data.target,
      metadata: data.metadata,
      userId: data.userId,
      projectId: data.projectId,
    },
  });
}

export async function getActivities(userId: string, limit = 50) {
  return prisma.activity.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      project: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function getProjectActivities(projectId: string, userId: string, limit = 20) {
  return prisma.activity.findMany({
    where: { projectId, userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
