import { z } from 'zod';
import { objectId } from '../../validators/common.js';

export const createPaymentSchema = z.preprocess((val) => {
  if (!val || typeof val !== 'object') return val;
  const data = { ...val };
  const map = {
    CASH: 'Cash',
    Cash: 'Cash',
    BANK: 'Bank',
    Bank: 'Bank',
    'Bank Transfer': 'Bank',
    BANK_TRANSFER: 'Bank',
    NEFT: 'Bank',
    UPI: 'UPI',
    CHEQUE: 'Cheque',
    Cheque: 'Cheque',
    CARD: 'Online',
    ONLINE: 'Online',
    Online: 'Online',
    OTHER: 'Other',
    Other: 'Other',
  };
  if (data.method && map[data.method]) data.method = map[data.method];
  if (data.amount != null) data.amount = Number(data.amount);
  return data;
}, z.object({
  invoiceId: objectId,
  customerId: objectId.optional().or(z.literal('')),
  amount: z.number().positive(),
  method: z.enum(['Cash', 'Bank', 'UPI', 'Cheque', 'Online', 'Other']),
  reference: z.string().optional(),
  paidAt: z.coerce.date().optional(),
  notes: z.string().optional(),
}));
