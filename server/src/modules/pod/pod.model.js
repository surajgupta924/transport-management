import mongoose from 'mongoose';

const podRecordSchema = new mongoose.Schema(
  {
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', index: true },
    receiverName: { type: String, required: true, trim: true },
    receiverPhone: { type: String, trim: true },
    receivedAt: { type: Date, default: Date.now },
    photoUrls: [{ type: String }],
    signatureUrl: { type: String },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['PENDING', 'UPLOADED', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    rejectionReason: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

podRecordSchema.index({ trip: 1, status: 1 });

export const PodRecord = mongoose.model('PodRecord', podRecordSchema);
