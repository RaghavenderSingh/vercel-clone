import { prisma } from "@titan/db";
import { createLogger } from "@vercel-clone/shared";
import { promises as dns } from 'dns';
import process from "node:process";

const logger = createLogger('api-server');

export async function addDomain(projectId: string, domain: string) {
  const existing = await prisma.domain.findUnique({
    where: { domain },
  });

  if (existing) {
    if (existing.projectId === projectId) {
      return existing;
    }
    throw new Error("Domain is already in use by another project");
  }

  return prisma.domain.create({
    data: {
      domain,
      projectId,
      verified: false,
    },
  });
}

export async function removeDomain(projectId: string, domain: string) {
  const existing = await prisma.domain.findFirst({
    where: { domain, projectId },
  });

  if (!existing) {
    throw new Error("Domain not found for this project");
  }

  return prisma.domain.delete({
    where: { id: existing.id },
  });
}

export async function verifyDomain(projectId: string, domain: string) {
  const existing = await prisma.domain.findFirst({
    where: { domain, projectId },
  });

  if (!existing) {
    throw new Error("Domain not found for this project");
  }

  let isVerified = false;

  if (domain.endsWith('.test') || domain.endsWith('.local') || domain.endsWith('.localhost')) {
      isVerified = true;
  } else {
      try {
          // 1. Check CNAME
          const expectedCname = process.env.PLATFORM_DOMAIN || 'titan.curiousdev.xyz'; 
          const cnames = await dns.resolveCname(domain);
          if (cnames.some(c => c.includes(expectedCname))) {
              isVerified = true;
          }
      } catch (e) {
      }

      if (!isVerified) {
          try {
              // 2. Check A Record
              const aRecords = await dns.resolve4(domain);
              const expectedIp = process.env.PLATFORM_IP || '34.228.213.135';
              if (aRecords.includes(expectedIp)) {
                  isVerified = true;
              }
          } catch (e) {
          }
      }
  }

  if (isVerified) {
    logger.info('Domain verified successfully', { domain, projectId });
    
    // TODO: Trigger SSL generation here
    
    return prisma.domain.update({
      where: { id: existing.id },
      data: { verified: true },
    });
  }

  const ip = process.env.PLATFORM_IP || '34.228.213.135';
  const cname = process.env.PLATFORM_DOMAIN || 'titan.curiousdev.xyz';
  throw new Error(`DNS verification failed. Please set a CNAME to ${cname} or A record to ${ip}`);
}

export async function getDomains(projectId: string) {
  return prisma.domain.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserDomains(userId: string) {
  return prisma.domain.findMany({
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
    orderBy: { createdAt: 'desc' },
  });
}
