import { z } from 'zod';
import { objectId } from '../../validators/common.js';
import { BOOKING_STATUSES } from './booking.model.js';

const addressInner = z
  .object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    pincode: z.string().optional(),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
  })
  .optional();

const locationSchema = z
  .object({
    name: z.string().optional(),
    contactName: z.string().optional(),
    contactPhone: z.string().optional(),
    contact: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    landmark: z.string().optional(),
    pincode: z.string().optional(),
    date: z.union([z.string(), z.coerce.date()]).optional(),
    address: z.union([z.string(), addressInner]).optional(),
    scheduledAt: z.coerce.date().optional(),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
  })
  .passthrough()
  .optional();

const chargesSchema = z
  .object({
    freight: z.coerce.number().min(0).optional(),
    loading: z.coerce.number().min(0).optional(),
    unloading: z.coerce.number().min(0).optional(),
    detention: z.coerce.number().min(0).optional(),
    other: z.coerce.number().min(0).optional(),
    discount: z.coerce.number().min(0).optional(),
    taxPercent: z.coerce.number().min(0).optional(),
    total: z.coerce.number().min(0).optional(),
  })
  .optional();

export const createBookingSchema = z.object({
  customerId: objectId.optional().or(z.literal('')),
  source: z.enum(['ONLINE', 'OFFLINE', 'ADMIN']).optional().default('ADMIN'),
  pickup: locationSchema,
  delivery: locationSchema,
  cargo: z
    .object({
      description: z.string().optional(),
      material: z.string().optional(),
      quantity: z.union([z.string(), z.coerce.number()]).optional(),
      weightKg: z.coerce.number().min(0).optional(),
      volumeCbm: z.coerce.number().min(0).optional(),
      packages: z.coerce.number().int().min(1).optional(),
      hazardous: z.boolean().optional(),
    })
    .optional(),
  vehicleTypeRequired: z.string().optional(),
  routeId: objectId.optional().or(z.literal('')),
  branchId: objectId.optional().or(z.literal('')),
  charges: chargesSchema,
  status: z.enum(['DRAFT', 'PENDING', 'CONFIRMED']).optional().default('DRAFT'),
  notes: z.string().optional(),
  remarks: z.string().optional(),
  paymentMode: z.enum(['PREPAID', 'TO_PAY', 'CREDIT']).optional(),
  otpToken: z.string().optional(),
  clientName: z.string().min(2).optional(),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
});

export const updateBookingSchema = createBookingSchema.partial().omit({ customerId: true }).extend({
  customerId: objectId.optional().or(z.literal('')),
});

export const transitionBookingSchema = z.object({
  status: z.enum(BOOKING_STATUSES),
  reason: z.string().optional(),
});
