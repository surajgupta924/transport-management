import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string().min(2).max(120),
  code: z.string().min(2).max(20),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z
    .object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
  isHeadOffice: z.boolean().optional(),
});

export const updateBranchSchema = createBranchSchema.partial();
