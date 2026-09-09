import mongoose from 'mongoose';

const expenseSettlementSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
    periodFrom: Date,
    periodTo: Date,
    expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }],
    expenseTotal: { type: Number, default: 0 },
    advanceGiven: { type: Number, default: 0 },
    advanceRecovered: { type: Number, default: 0 },
    netPayable: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['DRAFT', 'SETTLED', 'CANCELLED'],
      default: 'DRAFT',
      index: true,
    },
    settledAt: Date,
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const ExpenseSettlement = mongoose.model('ExpenseSettlement', expenseSettlementSchema);
