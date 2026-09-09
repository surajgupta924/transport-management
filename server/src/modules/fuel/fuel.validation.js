import { z } from 'zod';
import { objectId } from '../../validators/common.js';

export const createFuelSchema = z.object({
  vehicleId: objectId,
  driverId: objectId.optional().or(z.literal('')),
  tripId: objectId.optional().or(z.literal('')),
  date: z.coerce.date().optional(),
  odometerKm: z.number().min(0),
  liters: z.number().positive(),
  pricePerLiter: z.number().min(0).optional().default(0),
  totalAmount: z.number().min(0).optional(),
  fuelType: z.enum(['DIESEL', 'PETROL', 'CNG', 'ELECTRIC', 'OTHER']).optional(),
  station: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
});

export const updateFuelSchema = createFuelSchema.partial();
