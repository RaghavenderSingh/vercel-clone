import { prisma } from "@titan/db";
import { createLogger } from "@vercel-clone/shared";
import { promises as dns } from 'dns';

const logger = createLogger('api-server');

export async function addDomain(projectId: string, domain: string) {
  // Check if domain is already taken
  const existing = await prisma.domain.findUnique({
    where: { domain },
  });

  if (existing) {
    if (existing.projectId === projectId) {
      return existing; // Already added to this project
    }
    throw new Error("Domain is already in use by another project");
  }

  return prisma.domain.create({
    data: {
      domain,
      projectId,
      verified: false, // Default to unverified
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

  // Bypass for local testing domains
  if (domain.endsWith('.test') || domain.endsWith('.local') || domain.endsWith('.localhost')) {
      isVerified = true;
  } else {
      try {
          // 1. Check CNAME
          // In a real production environment, this would be your platform's main domain
          const expectedCname = process.env.PLATFORM_DOMAIN || 'vercel-clone.com'; 
          const cnames = await dns.resolveCname(domain);
          if (cnames.some(c => c.includes(expectedCname))) {
              isVerified = true;
          }
      } catch (e) {
          // logger.debug('CNAME lookup failed', { domain, error: e });
      }

      if (!isVerified) {
          try {
              // 2. Check A Record
              // In production, this would be your ingress IP
              const aRecords = await dns.resolve4(domain);
              const expectedIp = process.env.PLATFORM_IP || '127.0.0.1';
              if (aRecords.includes(expectedIp)) {
                  isVerified = true;
              }
          } catch (e) {
              // logger.debug('A record lookup failed', { domain, error: e });
          }
      }
  }

  if (isVerified) {
    logger.info('Domain verified successfully', { domain, projectId });
    return prisma.domain.update({
      where: { id: existing.id },
      data: { verified: true },
    });
  }

  // If verification fails, throw an error so the UI knows
  throw new Error("DNS verification failed. Please set a CNAME to vercel-clone.com or A record to 127.0.0.1");
}

export async function getDomains(projectId: string) {
  return prisma.domain.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
}
