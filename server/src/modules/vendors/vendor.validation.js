import { z } from 'zod';
import { objectId } from '../../validators/common.js';

export const createVendorSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().optional(),
  type: z.enum(['FUEL', 'MAINTENANCE', 'PARTS', 'SERVICE', 'OTHER']).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  gstin: z.string().optional(),
  address: z
    .object({
      line1: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  notes: z.string().optional(),
});

export const updateVendorSchema = createVendorSchema.partial();

export const vendorTxnSchema = z.object({
  type: z.enum(['DEBIT', 'CREDIT']),
  amount: z.number().positive(),
  referenceType: z.enum(['MAINTENANCE', 'EXPENSE', 'PAYMENT', 'ADJUSTMENT', 'OTHER']).optional(),
  referenceId: objectId.optional().or(z.literal('')),
  description: z.string().optional(),
  date: z.coerce.date().optional(),
});
