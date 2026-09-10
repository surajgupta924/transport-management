import mongoose from 'mongoose';

const loadingStaffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    employeeCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    mobile: { type: String, trim: true },
    designation: {
      type: String,
      enum: ['LOADER', 'SUPERVISOR', 'HELPER', 'WAREHOUSE'],
      default: 'LOADER',
      index: true,
    },
    incentiveRate: { type: Number, default: 0 },
    earnedIncentive: { type: Number, default: 0 },
    loadsCount: { type: Number, default: 0 },
    supervisedCount: { type: Number, default: 0 },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

loadingStaffSchema.index({ name: 1, status: 1 });

export const LoadingStaff = mongoose.model('LoadingStaff', loadingStaffSchema);
