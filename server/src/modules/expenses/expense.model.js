import mongoose from 'mongoose';

export const EXPENSE_CATEGORIES = [
  'FUEL',
  'TOLL',
  'PARKING',
  'FOOD',
  'REPAIR',
  'SALARY',
  'ADVANCE',
  'OFFICE',
  'OTHER',
];

const expenseSchema = new mongoose.Schema(
  {
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now, index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    rejectionReason: String,
    receiptUrl: String,
    location: { type: String, default: '' },
    liters: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

expenseSchema.index({ status: 1, date: -1 });

export const Expense = mongoose.model('Expense', expenseSchema);
