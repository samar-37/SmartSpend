import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    month: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    category: { type: String, trim: true, maxlength: 50, default: null },
    amountMinor: { type: Number, required: true, min: 1 },
    warningThresholds: { type: [Number], default: [75, 90, 100] },
  },
  { timestamps: true },
);

budgetSchema.index({ userId: 1, month: 1, category: 1 }, { unique: true });

export default mongoose.model('Budget', budgetSchema);
