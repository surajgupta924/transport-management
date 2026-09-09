import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    method: {
      type: String,
      enum: ['Cash', 'Bank', 'UPI', 'Cheque', 'Online', 'Other', 'CASH', 'NEFT', 'CHEQUE', 'CARD'],
      required: true,
    },
    reference: { type: String, trim: true },
    paidAt: { type: Date, default: Date.now, index: true },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['RECORDED', 'APPROVED', 'REJECTED'],
      default: 'APPROVED',
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
