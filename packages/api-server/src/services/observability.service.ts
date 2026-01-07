import { prisma } from "@titan/db";

export async function getProjectMetrics(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId }
  });
  if (!project) throw new Error("Project not found");

  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const usage = await prisma.projectUsage.findUnique({
    where: {
      projectId_date: {
        projectId,
        date: today
      }
    }
  });

  const deployments = await prisma.deployment.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  const errorRate = deployments.filter((d: any) => d.status === "error").length / deployments.length || 0;

  return {
    requests: usage?.requests || 0,
    bandwidth: Number(usage?.bandwidth || 0),
    invocations: usage?.invocations || 0,
    errorRate: parseFloat(errorRate.toFixed(2)),
    latency: 120,
    status: deployments[0]?.status || "no-deployments"
  };
}

export async function getDeploymentLogs(deploymentId: string, userId: string) {
    const deployment = await prisma.deployment.findUnique({
        where: { id: deploymentId },
        include: { project: true }
    });

    if (!deployment || deployment.project.userId !== userId) {
        throw new Error("Deployment not found or unauthorized");
    }

    return {
        logs: deployment.buildLogs || "",
        status: deployment.status
    };
}
