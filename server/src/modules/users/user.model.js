import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const refreshTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    userAgent: String,
    ip: String,
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, trim: true, sparse: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    avatarUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED'],
      default: 'PENDING_VERIFICATION',
      index: true,
    },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    lastLoginAt: Date,
    refreshTokens: { type: [refreshTokenSchema], select: false },
    portalType: {
      type: String,
      enum: ['STAFF', 'DRIVER', 'CUSTOMER'],
      default: 'STAFF',
      index: true,
    },
    linkedCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    linkedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  },
  { timestamps: true }
);

userSchema.index({ name: 'text', email: 'text' });

userSchema.methods.comparePassword = async function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = async function hashPassword(password) {
  return bcrypt.hash(password, 12);
};

export const User = mongoose.model('User', userSchema);
