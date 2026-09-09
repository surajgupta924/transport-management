import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8)
  .regex(/[A-Z]/, 'Must include uppercase')
  .regex(/[a-z]/, 'Must include lowercase')
  .regex(/[0-9]/, 'Must include a number');

export const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().toLowerCase(),
  mobile: z.string().optional().or(z.literal('')),
  password: passwordSchema,
  roleId: z.string().min(1),
  branchId: z.string().optional().or(z.literal('')),
  portalType: z.enum(['STAFF', 'DRIVER', 'CUSTOMER']).default('STAFF'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED']).optional().default('ACTIVE'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  mobile: z.string().optional().or(z.literal('')),
  roleId: z.string().min(1).optional(),
  branchId: z.string().optional().nullable().or(z.literal('')),
  portalType: z.enum(['STAFF', 'DRIVER', 'CUSTOMER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED']).optional(),
});
