import { z } from 'zod';
import { objectId } from '../../validators/common.js';

export const createLoadingStaffSchema = z.object({
  name: z.string().min(2),
  employeeCode: z.string().optional(),
  mobile: z.string().optional(),
  designation: z.enum(['LOADER', 'SUPERVISOR', 'HELPER', 'WAREHOUSE']).optional(),
  incentiveRate: z.coerce.number().min(0).optional(),
  branchId: objectId.optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  notes: z.string().optional(),
});

export const updateLoadingStaffSchema = createLoadingStaffSchema.partial();
