import mongoose from 'mongoose';

const customerLedgerSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    type: { type: String, enum: ['DEBIT', 'CREDIT'], required: true },
    amount: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true },
    referenceType: {
      type: String,
      enum: ['INVOICE', 'PAYMENT', 'ADJUSTMENT', 'CREDIT_NOTE', 'OTHER'],
      default: 'OTHER',
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    description: { type: String, default: '' },
    date: { type: Date, default: Date.now, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

customerLedgerSchema.index({ customer: 1, date: -1 });

export const CustomerLedger = mongoose.model('CustomerLedger', customerLedgerSchema);
