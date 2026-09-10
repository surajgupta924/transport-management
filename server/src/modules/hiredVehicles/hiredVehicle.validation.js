import { z } from 'zod';
import { objectId } from '../../validators/common.js';

export const createHiredVehicleSchema = z.object({
  registrationNumber: z.string().min(3).max(20),
  type: z.enum(['TRUCK', 'TRAILER', 'CONTAINER', 'TEMPO', 'PICKUP', 'TANKER', 'OTHER']).optional(),
  ownerName: z.string().optional(),
  ownerMobile: z.string().optional(),
  driverName: z.string().optional(),
  capacityTons: z.coerce.number().min(0).optional(),
  hireRate: z.coerce.number().min(0).optional(),
  status: z.enum(['ACTIVE', 'ON_TRIP', 'INACTIVE']).optional(),
  notes: z.string().optional(),
});

export const updateHiredVehicleSchema = createHiredVehicleSchema.partial();

export const createHiredTripSchema = z.object({
  hiredVehicleId: objectId,
  origin: z.string().optional(),
  destination: z.string().optional(),
  freight: z.coerce.number().min(0).optional(),
  tripDate: z.coerce.date().optional(),
  status: z.enum(['PLANNED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
});

export const createHiredPaymentSchema = z.object({
  hiredVehicleId: objectId,
  amount: z.coerce.number().positive(),
  method: z.string().optional(),
  reference: z.string().optional(),
  paidAt: z.coerce.date().optional(),
  notes: z.string().optional(),
});
