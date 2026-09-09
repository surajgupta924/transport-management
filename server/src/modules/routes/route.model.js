import mongoose from 'mongoose';

const stopSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    address: {
      line1: String,
      city: String,
      state: String,
      postalCode: String,
      lat: Number,
      lng: Number,
    },
    sequence: { type: Number, default: 0 },
  },
  { _id: true }
);

const routeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true, sparse: true },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    stops: [stopSchema],
    distanceKm: { type: Number, default: 0 },
    estimatedHours: { type: Number },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

routeSchema.index({ name: 'text', origin: 'text', destination: 'text' });

export const Route = mongoose.model('Route', routeSchema);
