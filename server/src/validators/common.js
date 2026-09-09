import { z } from 'zod';
import mongoose from 'mongoose';

export const objectId = z
  .string()
  .refine((v) => mongoose.Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' });

export const objectIdOptional = objectId.optional().nullable().or(z.literal(''));

export const addressObjectSchema = z.object({
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional().default('India'),
  postalCode: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const addressSchema = addressObjectSchema.optional();

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
});

export function emptyToUndefined(v) {
  if (v === '' || v === null) return undefined;
  return v;
}
