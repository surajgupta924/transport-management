import { z } from 'zod';
import { objectId } from '../../validators/common.js';
import { EXPENSE_CATEGORIES } from './expense.model.js';

const expenseFields = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  amount: z.number().positive(),
  date: z.coerce.date().optional(),
  vehicleId: objectId.optional().or(z.literal('')),
  driverId: objectId.optional().or(z.literal('')),
  tripId: objectId.optional().or(z.literal('')),
  branchId: objectId.optional().or(z.literal('')),
  vendorId: objectId.optional().or(z.literal('')),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
});

export const createExpenseSchema = z.preprocess((val) => {
  if (!val || typeof val !== 'object') return val;
  const data = { ...val };
  if (!data.title && data.description) data.title = data.description;
  if (data.amount != null) data.amount = Number(data.amount);
  return data;
}, expenseFields);

export const updateExpenseSchema = expenseFields.partial();

export const approveExpenseSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']).optional().default('APPROVED'),
  reason: z.string().optional(),
});
