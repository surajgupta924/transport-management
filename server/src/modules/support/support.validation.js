import { z } from 'zod';
import { objectId } from '../../validators/common.js';

export const createTicketSchema = z.object({
  subject: z.string().min(3).max(200),
  description: z.string().min(5),
  category: z.enum(['GENERAL', 'BOOKING', 'PAYMENT', 'TECHNICAL', 'COMPLAINT', 'OTHER']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  customerId: objectId.optional().or(z.literal('')),
});

export const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: objectId.optional().nullable().or(z.literal('')),
});

export const messageSchema = z.object({
  body: z.string().min(1),
});
