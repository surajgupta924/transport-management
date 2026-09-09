import mongoose from 'mongoose';

const fuelRecordSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', index: true },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', index: true },
    date: { type: Date, default: Date.now, index: true },
    odometerKm: { type: Number, required: true, min: 0 },
    liters: { type: Number, required: true, min: 0 },
    pricePerLiter: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0, min: 0 },
    fuelType: {
      type: String,
      enum: ['DIESEL', 'PETROL', 'CNG', 'ELECTRIC', 'OTHER'],
      default: 'DIESEL',
    },
    station: { type: String, trim: true },
    receiptUrl: String,
    notes: { type: String, default: '' },
    kmPerLiter: { type: Number },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

fuelRecordSchema.index({ vehicle: 1, date: -1 });

export const FuelRecord = mongoose.model('FuelRecord', fuelRecordSchema);

export function calcKmPerLiter(prevOdometer, currentOdometer, liters) {
  if (!liters || liters <= 0 || prevOdometer == null || currentOdometer == null) return null;
  const delta = currentOdometer - prevOdometer;
  if (delta <= 0) return null;
  return Number((delta / liters).toFixed(2));
}
