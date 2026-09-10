import { z } from 'zod';
import { objectId } from '../../validators/common.js';

export const createVehicleSchema = z.object({
  registrationNumber: z.string().min(3).max(20),
  type: z.enum(['TRUCK', 'TRAILER', 'CONTAINER', 'TEMPO', 'PICKUP', 'TANKER', 'OTHER']).default('TRUCK'),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().int().min(1980).max(2100).optional(),
  chassisNumber: z.string().optional(),
  engineNumber: z.string().optional(),
  fuelType: z.enum(['DIESEL', 'PETROL', 'CNG', 'ELECTRIC', 'HYBRID', 'OTHER']).default('DIESEL'),
  capacity: z
    .object({
      weightKg: z.coerce.number().min(0).optional(),
      volumeCbm: z.coerce.number().min(0).optional(),
    })
    .optional(),
  purchase: z
    .object({
      date: z.coerce.date().optional(),
      price: z.number().min(0).optional(),
      vendor: z.string().optional(),
    })
    .optional(),
  currentKm: z.coerce.number().min(0).optional().default(0),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'MAINTENANCE', 'INACTIVE', 'SOLD']).optional().default('AVAILABLE'),
  branchId: objectId.optional().or(z.literal('')),
  gpsDeviceId: z.string().optional(),
  ownership: z.enum(['OWNED', 'HIRED']).optional(),
  notes: z.string().optional(),
  nextServiceKm: z.number().optional(),
  nextServiceDate: z.coerce.date().optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export const vehicleDocumentSchema = z.object({
  type: z.enum(['RC', 'INSURANCE', 'PERMIT', 'FITNESS', 'PUC', 'TAX', 'OTHER']),
  number: z.string().optional(),
  issuedAt: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  fileUrl: z.string().optional(),
  notes: z.string().optional(),
});
