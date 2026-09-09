import { z } from 'zod';

const stopSchema = z.object({
  name: z.string().optional(),
  address: z
    .object({
      line1: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    })
    .optional(),
  sequence: z.number().int().optional(),
});

export const createRouteSchema = z.object({
  name: z.string().min(2).max(120),
  code: z.string().optional(),
  origin: z.string().min(2),
  destination: z.string().min(2),
  stops: z.array(stopSchema).optional(),
  distanceKm: z.number().min(0).optional().default(0),
  estimatedHours: z.number().min(0).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
  notes: z.string().optional(),
});

export const updateRouteSchema = createRouteSchema.partial();
