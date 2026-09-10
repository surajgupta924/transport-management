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

const partySchema = z
  .object({
    name: z.string().optional(),
    company: z.string().optional(),
    mobile: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    gstin: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    address: z.string().optional(),
    pincode: z.string().optional(),
  })
  .optional();

const chargesSchema = z
  .object({
    freight: z.coerce.number().min(0).optional(),
    loading: z.coerce.number().min(0).optional(),
    unloading: z.coerce.number().min(0).optional(),
    detention: z.coerce.number().min(0).optional(),
    fuelSurcharge: z.coerce.number().min(0).optional(),
    insurance: z.coerce.number().min(0).optional(),
    other: z.coerce.number().min(0).optional(),
    discount: z.coerce.number().min(0).optional(),
    taxPercent: z.coerce.number().min(0).optional(),
    gstTreatment: z.string().optional(),
    placeOfSupply: z.string().optional(),
    sacCode: z.string().optional(),
    total: z.coerce.number().min(0).optional(),
  })
  .optional();

export const createBookingSchema = z.object({
  customerId: objectId.optional().or(z.literal('')),
  source: z.enum(['ONLINE', 'OFFLINE', 'ADMIN']).optional().default('ADMIN'),
  shipmentNumber: z.string().optional(),
  lrNumber: z.string().optional(),
  containerNumber: z.string().optional(),
  bookingDate: z.coerce.date().optional(),
  stuffingDate: z.coerce.date().optional(),
  expectedDeliveryDate: z.coerce.date().optional(),
  pickup: locationSchema,
  delivery: locationSchema,
  consignor: partySchema,
  consignee: partySchema,
  cargo: z
    .object({
      description: z.string().optional(),
      material: z.string().optional(),
      quantity: z.union([z.string(), z.coerce.number()]).optional(),
      weightKg: z.coerce.number().min(0).optional(),
      volumeCbm: z.coerce.number().min(0).optional(),
      packages: z.coerce.number().int().min(0).optional(),
      hazardous: z.boolean().optional(),
    })
    .optional(),
  packages: z
    .array(
      z.object({
        type: z.string().optional(),
        quantity: z.coerce.number().optional(),
        weightKg: z.coerce.number().optional(),
        description: z.string().optional(),
        lengthCm: z.coerce.number().optional(),
        widthCm: z.coerce.number().optional(),
        heightCm: z.coerce.number().optional(),
      })
    )
    .optional(),
  items: z
    .array(
      z.object({
        name: z.string().optional(),
        hsn: z.string().optional(),
        quantity: z.coerce.number().optional(),
        unit: z.string().optional(),
      })
    )
    .optional(),
  loadingStaff: z
    .array(
      z.object({
        staff: objectId.optional(),
        staffId: objectId.optional(),
        rate: z.coerce.number().optional(),
        incentive: z.coerce.number().optional(),
      })
    )
    .optional(),
  vehicleTypeRequired: z.string().optional(),
  routeId: objectId.optional().or(z.literal('')),
  branchId: objectId.optional().or(z.literal('')),
  charges: chargesSchema,
  status: z.enum(['DRAFT', 'PENDING', 'CONFIRMED', 'UNASSIGNED']).optional().default('PENDING'),
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
