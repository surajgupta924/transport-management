import mongoose from 'mongoose';

export const BOOKING_STATUSES = [
  'DRAFT',
  'PENDING',
  'CONFIRMED',
  'UNASSIGNED',
  'ASSIGNED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'POD_UPLOADED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
];

export const BOOKING_TRANSITIONS = {
  DRAFT: ['PENDING', 'CONFIRMED', 'UNASSIGNED', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'UNASSIGNED', 'CANCELLED'],
  CONFIRMED: ['UNASSIGNED', 'ASSIGNED', 'CANCELLED'],
  UNASSIGNED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'DELIVERED', 'POD_UPLOADED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'POD_UPLOADED', 'CANCELLED'],
  POD_UPLOADED: ['DELIVERED', 'COMPLETED', 'CANCELLED'],
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

const partySchema = new mongoose.Schema(
  {
    name: String,
    company: String,
    mobile: String,
    email: String,
    gstin: String,
    city: String,
    state: String,
    address: String,
    pincode: String,
  },
  { _id: false }
);

const packageSchema = new mongoose.Schema(
  {
    type: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    weightKg: { type: Number, default: 0 },
    description: String,
    lengthCm: Number,
    widthCm: Number,
    heightCm: Number,
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    name: String,
    hsn: String,
    quantity: { type: Number, default: 1 },
    unit: { type: String, default: 'PCS' },
  },
  { _id: false }
);

const loadingAssignmentSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'LoadingStaff' },
    rate: { type: Number, default: 0 },
    incentive: { type: Number, default: 0 },
  },
  { _id: false }
);

const chargesSchema = new mongoose.Schema(
  {
    freight: { type: Number, default: 0 },
    loading: { type: Number, default: 0 },
    unloading: { type: Number, default: 0 },
    detention: { type: Number, default: 0 },
    fuelSurcharge: { type: Number, default: 0 },
    insurance: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    gstTreatment: { type: String, default: 'Forward Charge' },
    placeOfSupply: String,
    sacCode: { type: String, default: '9965' },
    taxableAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, unique: true, index: true },
    shipmentNumber: { type: String, unique: true, sparse: true, index: true },
    lrNumber: { type: String, index: true },
    containerNumber: String,
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    source: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'ADMIN'],
      default: 'ADMIN',
      index: true,
    },
    bookingDate: { type: Date, default: Date.now },
    stuffingDate: Date,
    expectedDeliveryDate: Date,
    pickup: locationSchema,
    delivery: locationSchema,
    consignor: { type: partySchema, default: () => ({}) },
    consignee: { type: partySchema, default: () => ({}) },
    cargo: {
      description: String,
      material: String,
      quantity: String,
      weightKg: { type: Number, default: 0 },
      volumeCbm: { type: Number, default: 0 },
      packages: { type: Number, default: 1 },
      hazardous: { type: Boolean, default: false },
    },
    packages: { type: [packageSchema], default: [] },
    items: { type: [itemSchema], default: [] },
    loadingStaff: { type: [loadingAssignmentSchema], default: [] },
    vehicleTypeRequired: String,
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    charges: { type: chargesSchema, default: () => ({}) },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'PENDING',
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
bookingSchema.index({ lrNumber: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);

export function computeCharges(charges = {}) {
  const freight = Number(charges.freight) || 0;
  const loading = Number(charges.loading) || 0;
  const unloading = Number(charges.unloading) || 0;
  const detention = Number(charges.detention) || 0;
  const fuelSurcharge = Number(charges.fuelSurcharge) || 0;
  const insurance = Number(charges.insurance) || 0;
  const other = Number(charges.other) || 0;
  const discount = Number(charges.discount) || 0;
  const taxPercent = Number(charges.taxPercent) || 0;
  const taxableAmount = Math.max(
    0,
    freight + loading + unloading + detention + fuelSurcharge + insurance + other - discount
  );
  const taxAmount = Number(((taxableAmount * taxPercent) / 100).toFixed(2));
  const total = Number((taxableAmount + taxAmount).toFixed(2));
  return {
    freight,
    loading,
    unloading,
    detention,
    fuelSurcharge,
    insurance,
    other,
    discount,
    taxPercent,
    taxAmount,
    gstTreatment: charges.gstTreatment || 'Forward Charge',
    placeOfSupply: charges.placeOfSupply || '',
    sacCode: charges.sacCode || '9965',
    taxableAmount,
    total,
  };
}
