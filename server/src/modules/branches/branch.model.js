import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      country: { type: String, default: 'India' },
      postalCode: String,
    },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    isHeadOffice: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Branch = mongoose.model('Branch', branchSchema);
