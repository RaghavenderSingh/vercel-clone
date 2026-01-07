import { prisma } from "@titan/db";

export async function getProjectUsage(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId }
  });
  if (!project) throw new Error("Project not found");

  return prisma.projectUsage.findMany({
    where: { projectId },
    orderBy: { date: "desc" },
    take: 30,
  });
}

interface UsageTotal {
  requests: number;
  bandwidth: number;
  invocations: number;
}

export async function getUserTotalUsage(userId: string) {
  const usages = await prisma.projectUsage.findMany({
    where: {
      project: {
        userId
      }
    }
  });

  return (usages as any[]).reduce((acc: UsageTotal, curr: any) => ({
    requests: acc.requests + (curr.requests || 0),
    bandwidth: acc.bandwidth + Number(curr.bandwidth || 0),
    invocations: acc.invocations + (curr.invocations || 0),
  }), { requests: 0, bandwidth: 0, invocations: 0 });
}
