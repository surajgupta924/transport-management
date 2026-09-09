import mongoose from 'mongoose';

export const BOOKING_STATUSES = [
  'DRAFT',
  'PENDING',
  'CONFIRMED',
  'ASSIGNED',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
];

export const BOOKING_TRANSITIONS = {
  DRAFT: ['PENDING', 'CONFIRMED', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED', 'COMPLETED', 'CANCELLED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

const locationSchema = new mongoose.Schema(
  {
    name: String,
    contactName: String,
    contactPhone: String,
    landmark: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      country: { type: String, default: 'India' },
      postalCode: String,
      lat: Number,
      lng: Number,
    },
    scheduledAt: Date,
  },
  { _id: false }
);

const chargesSchema = new mongoose.Schema(
  {
    freight: { type: Number, default: 0 },
    loading: { type: Number, default: 0 },
    unloading: { type: Number, default: 0 },
    detention: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    source: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'ADMIN'],
      default: 'ADMIN',
      index: true,
    },
    pickup: locationSchema,
    delivery: locationSchema,
    cargo: {
      description: String,
      material: String,
      quantity: String,
      weightKg: { type: Number, default: 0 },
      volumeCbm: { type: Number, default: 0 },
      packages: { type: Number, default: 1 },
      hazardous: { type: Boolean, default: false },
    },
    vehicleTypeRequired: String,
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    charges: { type: chargesSchema, default: () => ({}) },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'DRAFT',
      index: true,
    },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    notes: { type: String, default: '' },
    paymentMode: {
      type: String,
      enum: ['PREPAID', 'TO_PAY', 'CREDIT'],
      default: 'TO_PAY',
    },
    cancelledReason: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ source: 1, createdAt: -1 });

export const Booking = mongoose.model('Booking', bookingSchema);

export function computeCharges(charges = {}) {
  const freight = Number(charges.freight) || 0;
  const loading = Number(charges.loading) || 0;
  const unloading = Number(charges.unloading) || 0;
  const detention = Number(charges.detention) || 0;
  const other = Number(charges.other) || 0;
  const discount = Number(charges.discount) || 0;
  const taxPercent = Number(charges.taxPercent) || 0;
  const subtotal = Math.max(0, freight + loading + unloading + detention + other - discount);
  const taxAmount = Number(((subtotal * taxPercent) / 100).toFixed(2));
  const total = Number((subtotal + taxAmount).toFixed(2));
  return {
    freight,
    loading,
    unloading,
    detention,
    other,
    discount,
    taxPercent,
    taxAmount,
    total,
  };
}
