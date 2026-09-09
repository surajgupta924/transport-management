import mongoose from 'mongoose';

const tripLocationSchema = new mongoose.Schema(
  {
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracy: Number,
    speed: Number,
    heading: Number,
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

tripLocationSchema.index({ trip: 1, timestamp: -1 });

export const TripLocation = mongoose.model('TripLocation', tripLocationSchema);
