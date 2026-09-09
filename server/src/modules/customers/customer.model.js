import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    mobile: { type: String, trim: true },
    designation: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: true }
);

const documentMetaSchema = new mongoose.Schema(
  {
    type: { type: String, trim: true },
    name: { type: String, trim: true },
    fileUrl: { type: String, trim: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'default' },
    line1: String,
    line2: String,
    city: String,
    state: String,
    country: { type: String, default: 'India' },
    postalCode: String,
    lat: Number,
    lng: Number,
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const customerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['INDIVIDUAL', 'COMPANY'],
      default: 'COMPANY',
      index: true,
    },
    source: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'ADMIN', 'IMPORTED'],
      default: 'ADMIN',
      index: true,
    },
    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, sparse: true },
    mobile: { type: String, trim: true, sparse: true },
    contacts: [contactSchema],
    gstin: { type: String, trim: true, uppercase: true },
    pan: { type: String, trim: true, uppercase: true },
    addresses: [addressSchema],
    billingAddress: addressSchema,
    shippingAddress: addressSchema,
    paymentTerms: { type: String, default: 'NET_30' },
    creditLimit: { type: Number, default: 0, min: 0 },
    outstandingBalance: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'],
      default: 'ACTIVE',
      index: true,
    },
    notes: { type: String, default: '' },
    crmNotes: [
      {
        body: { type: String, required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    tags: [{ type: String, trim: true }],
    documents: [documentMetaSchema],
    portalUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    invitedAt: Date,
  },
  { timestamps: true }
);

customerSchema.index({ name: 'text', company: 'text', email: 'text', mobile: 'text' });
customerSchema.index({ email: 1 }, { unique: true, sparse: true });
customerSchema.index({ mobile: 1 }, { unique: true, sparse: true });

export const Customer = mongoose.model('Customer', customerSchema);
