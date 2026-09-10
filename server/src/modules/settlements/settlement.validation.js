import { z } from 'zod';
import { objectId } from '../../validators/common.js';

export const createSettlementSchema = z.object({
  driverId: objectId,
  periodFrom: z.coerce.date().optional(),
  periodTo: z.coerce.date().optional(),
  expenseIds: z.array(objectId).optional().default([]),
  advanceGiven: z.number().min(0).optional().default(0),
  advanceRecovered: z.number().min(0).optional().default(0),
  notes: z.string().optional(),
});

export const updateSettlementSchema = createSettlementSchema.partial();

export const settleSchema = z.object({
  status: z.enum(['SETTLED', 'CANCELLED']).default('SETTLED'),
});

export const recordAdvanceSchema = z
  .object({
    tripId: objectId.optional(),
    driverId: objectId.optional(),
    amount: z.coerce.number().positive(),
    date: z.coerce.date().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.tripId || data.driverId, { message: 'Trip or driver is required' });
