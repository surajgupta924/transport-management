import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema(
  {
    employeeId: { type: String, trim: true, sparse: true },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true, sparse: true },
    licenseNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    licenseType: { type: String, trim: true },
    licenseExpiry: { type: Date },
    dateOfBirth: Date,
    joiningDate: Date,
    salary: {
      basic: { type: Number, default: 0 },
      allowance: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
    },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      country: { type: String, default: 'India' },
      postalCode: String,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'ON_TRIP', 'ON_LEAVE', 'INACTIVE'],
      default: 'AVAILABLE',
      index: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    advanceBalance: { type: Number, default: 0 },
    emergencyContact: {
      name: String,
      mobile: String,
      relation: String,
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

driverSchema.index({ name: 'text', mobile: 'text', licenseNumber: 'text' });

export const Driver = mongoose.model('Driver', driverSchema);

const driverDocumentSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
    type: {
      type: String,
      enum: ['LICENSE', 'AADHAR', 'PAN', 'MEDICAL', 'POLICE_VERIFICATION', 'OTHER'],
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

export const DriverDocument = mongoose.model('DriverDocument', driverDocumentSchema);
