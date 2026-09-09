import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  description: z.string().max(300).optional().default(''),
  permissionIds: z.array(z.string().min(1)).min(1, 'Select at least one permission'),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
});

export const updateRoleSchema = createRoleSchema.partial().extend({
  permissionIds: z.array(z.string().min(1)).optional(),
});
