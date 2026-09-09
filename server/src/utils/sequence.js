import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
    year: { type: Number },
  },
  { timestamps: true }
);

export const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

/**
 * Atomically increments a named counter and returns a formatted number.
 * @param {string} prefix e.g. 'BK', 'TR', 'INV'
 * @param {{ pad?: number, yearly?: boolean }} options
 */
export async function nextSequence(prefix, { pad = 6, yearly = true } = {}) {
  const year = new Date().getFullYear();
  const name = yearly ? `${prefix}-${year}` : prefix;

  const filter = yearly ? { name, year } : { name };
  const update = {
    $inc: { seq: 1 },
    $setOnInsert: yearly ? { year } : {},
  };

  const doc = await Counter.findOneAndUpdate(filter, update, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });

  const num = String(doc.seq).padStart(pad, '0');
  return yearly ? `${prefix}-${year}-${num}` : `${prefix}-${num}`;
}

export async function nextBookingNumber() {
  return nextSequence('BK');
}

export async function nextTripNumber() {
  return nextSequence('TR');
}

export async function nextInvoiceNumber() {
  return nextSequence('INV');
}
