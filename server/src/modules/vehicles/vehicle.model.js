import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: {
      type: String,
      enum: ['TRUCK', 'TRAILER', 'CONTAINER', 'TEMPO', 'PICKUP', 'TANKER', 'OTHER'],
      default: 'TRUCK',
      index: true,
    },
    manufacturer: { type: String, trim: true },
    model: { type: String, trim: true },
    year: { type: Number },
    chassisNumber: { type: String, trim: true },
    engineNumber: { type: String, trim: true },
    fuelType: {
      type: String,
      enum: ['DIESEL', 'PETROL', 'CNG', 'ELECTRIC', 'HYBRID', 'OTHER'],
      default: 'DIESEL',
    },
    capacity: {
      weightKg: { type: Number, default: 0 },
      volumeCbm: { type: Number, default: 0 },
    },
    purchase: {
      date: Date,
      price: Number,
      vendor: String,
    },
    currentKm: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['AVAILABLE', 'ON_TRIP', 'MAINTENANCE', 'INACTIVE', 'SOLD'],
      default: 'AVAILABLE',
      index: true,
    },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    notes: { type: String, default: '' },
    nextServiceKm: { type: Number },
    nextServiceDate: Date,
  },
  { timestamps: true }
);

vehicleSchema.index({ registrationNumber: 1 });
vehicleSchema.index({ type: 1, status: 1 });

export const Vehicle = mongoose.model('Vehicle', vehicleSchema);

const vehicleDocumentSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    type: {
      type: String,
      enum: ['RC', 'INSURANCE', 'PERMIT', 'FITNESS', 'PUC', 'TAX', 'OTHER'],
      required: true,
    },
    number: { type: String, trim: true },
    issuedAt: Date,
    expiryDate: { type: Date, index: true },
    fileUrl: { type: String, trim: true },
    notes: String,
  },
  { timestamps: true }
);

vehicleDocumentSchema.index({ vehicle: 1, type: 1 });

export const VehicleDocument = mongoose.model('VehicleDocument', vehicleDocumentSchema);
