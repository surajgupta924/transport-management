import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true, sparse: true },
    type: {
      type: String,
      enum: ['FUEL', 'MAINTENANCE', 'PARTS', 'SERVICE', 'OTHER'],
      default: 'OTHER',
    },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    gstin: { type: String, trim: true, uppercase: true },
    address: {
      line1: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: 'India' },
    },
    balance: { type: Number, default: 0 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

vendorSchema.index({ name: 'text', phone: 'text' });

export const Vendor = mongoose.model('Vendor', vendorSchema);

const vendorTransactionSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    type: { type: String, enum: ['DEBIT', 'CREDIT'], required: true },
    amount: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true },
    referenceType: { type: String, enum: ['MAINTENANCE', 'EXPENSE', 'PAYMENT', 'ADJUSTMENT', 'OTHER'], default: 'OTHER' },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    description: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

vendorTransactionSchema.index({ vendor: 1, date: -1 });

export const VendorTransaction = mongoose.model('VendorTransaction', vendorTransactionSchema);
