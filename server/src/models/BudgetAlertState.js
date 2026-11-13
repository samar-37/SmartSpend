import mongoose from 'mongoose';

const budgetAlertStateSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    budgetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget', required: true, index: true },
    month: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    threshold: { type: Number, required: true, min: 1, max: 100 },
    triggeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

budgetAlertStateSchema.index({ userId: 1, budgetId: 1, month: 1, threshold: 1 }, { unique: true });

export default mongoose.model('BudgetAlertState', budgetAlertStateSchema);
