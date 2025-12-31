import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(3, 'Email must be at least 3 characters')
    .max(255, 'Email is too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/\d/, 'Password must contain at least one number'),
  name: z.string()
    .min(1, 'Name must be at least 1 character')
    .max(100, 'Name is too long')
    .optional(),
});

export const LoginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email is too long'),
  password: z.string()
    .min(1, 'Password is required')
    .max(100, 'Password is too long'),
});
