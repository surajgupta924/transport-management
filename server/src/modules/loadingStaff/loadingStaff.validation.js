import { z } from 'zod';
import { objectId } from '../../validators/common.js';

export const createLoadingStaffSchema = z.object({
  name: z.string().min(2),
  employeeCode: z.string().optional(),
  mobile: z.string().optional(),
  designation: z.enum(['LOADER', 'SUPERVISOR', 'HELPER', 'WAREHOUSE']).optional(),
  incentiveRate: z.coerce.number().min(0).optional(),
  incentiveUnit: z.enum(['PER_KG', 'PER_QUINTAL', 'PER_LOAD']).optional(),
  salaryType: z.enum(['MONTHLY', 'DAILY', 'INCENTIVE']).optional(),
  monthlySalary: z.coerce.number().min(0).optional(),
  joiningDate: z.coerce.date().optional(),
  branchName: z.string().optional(),
  address: z.string().optional(),
  branchId: objectId.optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  notes: z.string().optional(),
});

export const updateLoadingStaffSchema = createLoadingStaffSchema.partial();
