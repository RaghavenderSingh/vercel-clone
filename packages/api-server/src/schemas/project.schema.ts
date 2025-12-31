import { z } from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(50, 'Project name is too long')
    .regex(/^[a-z0-9-]+$/, 'Project name must contain only lowercase letters, numbers, and hyphens'),
  repoUrl: z.string()
    .url('Invalid repository URL')
    .max(500, 'Repository URL is too long')
    .optional()
    .or(z.literal('')),
  framework: z.enum(['nextjs', 'react', 'vue', 'static', 'unknown'])
    .default('unknown'),
});

export const UpdateProjectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(50, 'Project name is too long')
    .regex(/^[a-z0-9-]+$/, 'Project name must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  repoUrl: z.string()
    .url('Invalid repository URL')
    .max(500, 'Repository URL is too long')
    .optional(),
  framework: z.enum(['nextjs', 'react', 'vue', 'static', 'unknown'])
    .optional(),
});
