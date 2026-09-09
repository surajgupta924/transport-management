import mongoose from 'mongoose';

const maintenanceRecordSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    type: {
      type: String,
      enum: ['SERVICE', 'REPAIR', 'TYRE', 'BATTERY', 'INSPECTION', 'OTHER'],
      default: 'SERVICE',
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    date: { type: Date, default: Date.now, index: true },
    odometerKm: { type: Number, min: 0 },
    cost: { type: Number, default: 0, min: 0 },
    partsCost: { type: Number, default: 0 },
    laborCost: { type: Number, default: 0 },
    nextServiceKm: { type: Number },
    nextServiceDate: Date,
    status: {
      type: String,
      enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'COMPLETED',
      index: true,
    },
    invoiceUrl: String,
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

maintenanceRecordSchema.index({ vehicle: 1, date: -1 });

export const MaintenanceRecord = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);
