import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema(
  {
    module: { type: String, required: true, trim: true, lowercase: true, index: true },
    action: { type: String, required: true, trim: true, lowercase: true },
    code: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

permissionSchema.index({ module: 1, action: 1 }, { unique: true });

export const Permission = mongoose.model('Permission', permissionSchema);
