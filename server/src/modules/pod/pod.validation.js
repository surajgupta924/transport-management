import { z } from 'zod';
import { objectId } from '../../validators/common.js';

const podFields = z.object({
  tripId: objectId,
  bookingId: objectId.optional().or(z.literal('')),
  receiverName: z.string().min(2),
  receivedBy: z.string().optional(),
  receiverPhone: z.string().optional(),
  receivedAt: z.coerce.date().optional(),
  deliveredAt: z.coerce.date().optional(),
  photoUrls: z.array(z.string()).optional().default([]),
  photoUrl: z.string().optional().or(z.literal('')),
  signatureUrl: z.string().optional(),
  notes: z.string().optional(),
  remarks: z.string().optional(),
  status: z.enum(['PENDING', 'UPLOADED']).optional().default('UPLOADED'),
});

export const createPodSchema = z.preprocess((val) => {
  if (!val || typeof val !== 'object') return val;
  const data = { ...val };
  if (!data.receiverName && data.receivedBy) data.receiverName = data.receivedBy;
  if (!data.receivedAt && data.deliveredAt) data.receivedAt = data.deliveredAt;
  if (!data.notes && data.remarks) data.notes = data.remarks;
  if (!data.photoUrls && data.photoUrl) data.photoUrls = [data.photoUrl];
  return data;
}, podFields);

export const updatePodSchema = podFields.partial().omit({ tripId: true });

export const verifyPodSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  reason: z.string().optional(),
});
