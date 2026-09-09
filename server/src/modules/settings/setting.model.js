import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    group: { type: String, default: 'general', index: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Setting = mongoose.model('Setting', settingSchema);
