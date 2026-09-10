import mongoose from 'mongoose';

export const TRIP_STATUSES = [
  'PLANNED',
  'PENDING',
  'ASSIGNED',
  'STARTED',
  'IN_PROGRESS',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'COMPLETED',
  'CANCELLED',
];

export const ACTIVE_TRIP_STATUSES = ['ASSIGNED', 'STARTED', 'IN_PROGRESS', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'];

export const TRIP_TRANSITIONS = {
  PLANNED: ['ASSIGNED', 'CANCELLED'],
  PENDING: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['STARTED', 'CANCELLED'],
  STARTED: ['IN_TRANSIT', 'IN_PROGRESS', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'],
  IN_PROGRESS: ['OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function normalizeTripStatus(status) {
  if (status === 'PENDING') return 'PLANNED';
  if (status === 'IN_PROGRESS') return 'IN_TRANSIT';
  return status;
}

const tripSchema = new mongoose.Schema(
  {
    tripNumber: { type: String, unique: true, index: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', index: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', index: true },
    helper: {
      name: String,
      mobile: String,
    },
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
    status: {
      type: String,
      enum: TRIP_STATUSES,
      default: 'PLANNED',
      index: true,
    },
    startKm: { type: Number, default: 0 },
    endKm: { type: Number },
    distanceKm: { type: Number },
    startTime: Date,
    endTime: Date,
    notes: { type: String, default: '' },
    lastLocation: {
      lat: Number,
      lng: Number,
      speed: Number,
      heading: Number,
      accuracy: Number,
      source: { type: String, default: 'DRIVER_MOBILE' },
      updatedAt: Date,
    },
    locationSharing: { type: Boolean, default: false },
    assignmentStatus: {
      type: String,
      enum: ['PENDING_APPROVAL', 'ASSIGNED', 'ACCEPTED', 'REJECTED', 'RELEASED'],
      default: 'PENDING_APPROVAL',
      index: true,
    },
    acceptedAt: Date,
    rejectedAt: Date,
    releasedAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

tripSchema.index({ status: 1, startTime: -1 });
tripSchema.index({ driver: 1, status: 1 });
tripSchema.index({ vehicle: 1, status: 1 });

export const Trip = mongoose.model('Trip', tripSchema);
