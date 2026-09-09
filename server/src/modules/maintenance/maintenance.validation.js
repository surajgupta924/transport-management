import { z } from 'zod';
import { objectId } from '../../validators/common.js';

export const createMaintenanceSchema = z.object({
  vehicleId: objectId,
  vendorId: objectId.optional().or(z.literal('')),
  type: z.enum(['SERVICE', 'REPAIR', 'TYRE', 'BATTERY', 'INSPECTION', 'OTHER']).default('SERVICE'),
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  date: z.coerce.date().optional(),
  odometerKm: z.number().min(0).optional(),
  cost: z.number().min(0).optional().default(0),
  partsCost: z.number().min(0).optional(),
  laborCost: z.number().min(0).optional(),
  nextServiceKm: z.number().min(0).optional(),
  nextServiceDate: z.coerce.date().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional().default('COMPLETED'),
  invoiceUrl: z.string().optional(),
  notes: z.string().optional(),
});

export const updateMaintenanceSchema = createMaintenanceSchema.partial();
