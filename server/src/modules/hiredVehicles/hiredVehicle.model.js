import mongoose from 'mongoose';

const hiredVehicleSchema = new mongoose.Schema(
  {
    registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: {
      type: String,
      enum: ['TRUCK', 'TRAILER', 'CONTAINER', 'TEMPO', 'PICKUP', 'TANKER', 'OTHER'],
      default: 'TRUCK',
    },
    ownerName: { type: String, trim: true },
    ownerMobile: { type: String, trim: true },
    driverName: { type: String, trim: true },
    capacityTons: { type: Number, default: 0 },
    hireRate: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['ACTIVE', 'ON_TRIP', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

hiredVehicleSchema.index({ registrationNumber: 1 });

export const HiredVehicle = mongoose.model('HiredVehicle', hiredVehicleSchema);

const hiredTripSchema = new mongoose.Schema(
  {
    hiredVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'HiredVehicle', required: true, index: true },
    origin: String,
    destination: String,
    freight: { type: Number, default: 0 },
    tripDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['PLANNED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'],
      default: 'PLANNED',
    },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const HiredTrip = mongoose.model('HiredTrip', hiredTripSchema);

const hiredPaymentSchema = new mongoose.Schema(
  {
    hiredVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'HiredVehicle', required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    method: { type: String, default: 'CASH' },
    reference: String,
    paidAt: { type: Date, default: Date.now },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const HiredPayment = mongoose.model('HiredPayment', hiredPaymentSchema);
