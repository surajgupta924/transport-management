import mongoose from 'mongoose';

const invoiceLineSchema = new mongoose.Schema(
  {
    description: String,
    quantity: { type: Number, default: 1 },
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    lines: [invoiceLineSchema],
    subtotal: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    amountDue: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'CANCELLED', 'OVERDUE'],
      default: 'DRAFT',
      index: true,
    },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, index: true },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

invoiceSchema.index({ customer: 1, status: 1 });

export const Invoice = mongoose.model('Invoice', invoiceSchema);

export function computeInvoiceTotals({ lines = [], taxPercent = 0, discount = 0 }) {
  const subtotal = lines.reduce((sum, l) => sum + (l.amount ?? (l.quantity || 1) * (l.rate || 0)), 0);
  const taxAmount = Number((((subtotal - discount) * taxPercent) / 100).toFixed(2));
  const total = Number((subtotal - discount + taxAmount).toFixed(2));
  return { subtotal, taxAmount, total, amountDue: total };
}
