import { z } from 'zod';
import { objectId } from '../../validators/common.js';

const lineSchema = z.object({
  description: z.string().optional(),
  quantity: z.number().positive().optional().default(1),
  rate: z.number().min(0).optional().default(0),
  amount: z.number().min(0).optional(),
});

export const createInvoiceSchema = z.object({
  customerId: objectId,
  bookingId: objectId.optional().or(z.literal('')),
  tripId: objectId.optional().or(z.literal('')),
  lines: z.array(lineSchema).optional(),
  taxPercent: z.number().min(0).optional().default(0),
  discount: z.number().min(0).optional().default(0),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'ISSUED']).optional().default('DRAFT'),
  fromBooking: z.boolean().optional(),
  amount: z.coerce.number().min(0).optional(),
  taxAmount: z.coerce.number().min(0).optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const issueInvoiceSchema = z.object({
  status: z.enum(['ISSUED', 'CANCELLED']).default('ISSUED'),
});
