import { z } from 'zod';
import { objectId } from '../../validators/common.js';
import { TRIP_STATUSES } from './trip.model.js';

export const createTripSchema = z.object({
  bookingId: objectId,
  vehicleId: objectId.optional().or(z.literal('')),
  driverId: objectId.optional().or(z.literal('')),
  helper: z
    .object({
      name: z.string().optional(),
      mobile: z.string().optional(),
    })
    .optional(),
  routeId: objectId.optional().or(z.literal('')),
  startKm: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const assignTripSchema = z.object({
  vehicleId: objectId,
  driverId: objectId,
  helper: z
    .object({
      name: z.string().optional(),
      mobile: z.string().optional(),
    })
    .optional(),
  startKm: z.number().min(0).optional(),
});

export const updateTripSchema = z.object({
  helper: z
    .object({
      name: z.string().optional(),
      mobile: z.string().optional(),
    })
    .optional(),
  routeId: objectId.optional().nullable().or(z.literal('')),
  startKm: z.number().min(0).optional(),
  endKm: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const transitionTripSchema = z.object({
  status: z.enum(TRIP_STATUSES),
  endKm: z.number().min(0).optional(),
  reason: z.string().optional(),
});

export const tripLocationSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  accuracy: z.coerce.number().optional(),
  speed: z.coerce.number().optional().nullable(),
  heading: z.coerce.number().optional().nullable(),
  timestamp: z.union([z.string(), z.coerce.date(), z.coerce.number()]).optional(),
  ts: z.union([z.string(), z.coerce.date(), z.coerce.number()]).optional(),
  source: z.string().optional(),
});

export const tripSharingSchema = z.object({
  sharing: z.coerce.boolean(),
});

export const assignShipmentSchema = z.object({
  bookingId: objectId,
  vehicleId: objectId,
  driverId: objectId,
  helper: z
    .object({
      name: z.string().optional(),
      mobile: z.string().optional(),
    })
    .optional(),
  startKm: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const rejectAssignmentSchema = z.object({
  reason: z.string().optional(),
});
