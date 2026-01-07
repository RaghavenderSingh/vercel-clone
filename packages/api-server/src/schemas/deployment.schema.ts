import { z } from 'zod';

export const CreateDeploymentSchema = z.object({
  projectId: z.string()
    .uuid('Invalid project ID format'),
  type: z.enum(['manual', 'git'])
    .optional()
    .default('git'),
  commitSha: z.string()
    .min(1, 'Commit SHA is required')
    .max(100, 'Commit SHA is too long'),
  branch: z.string()
    .min(1, 'Branch name is required')
    .max(255, 'Branch name is too long')
    .regex(/^[a-zA-Z0-9/_.-]+$/, 'Invalid branch name format'),
  commitMessage: z.string()
    .max(500, 'Commit message is too long')
    .optional(),
}).refine((data) => {
  if (data.type === 'git') {
    return /^[a-f0-9]{7,40}$/i.test(data.commitSha);
  }
  return true;
}, {
  message: 'Invalid commit SHA format for git deployment. Must be 7-40 hexadecimal characters.',
  path: ['commitSha'],
});

export const DeployProjectSchema = z.object({
  projectName: z.string()
    .min(1, 'Project name is required')
    .max(50, 'Project name is too long')
    .regex(/^[a-z0-9-]+$/, 'Project name must contain only lowercase letters, numbers, and hyphens'),
});
