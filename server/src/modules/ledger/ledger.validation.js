import { z } from 'zod';
import { objectId } from '../../validators/common.js';

export const createLedgerEntrySchema = z.object({
  customerId: objectId,
  type: z.enum(['DEBIT', 'CREDIT']),
  amount: z.number().positive(),
  referenceType: z.enum(['INVOICE', 'PAYMENT', 'ADJUSTMENT', 'CREDIT_NOTE', 'OTHER']).optional(),
  referenceId: objectId.optional().or(z.literal('')),
  description: z.string().optional(),
  date: z.coerce.date().optional(),
});
