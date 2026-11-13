import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema({
  amountMinor: { type: Number, required: true, min: 1 },
  date: { type: Date, required: true },
  note: { type: String, trim: true, maxlength: 300, default: '' },
}, { _id: true, timestamps: true });

const savingsGoalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    targetAmountMinor: { type: Number, required: true, min: 1 },
    targetDate: { type: Date, required: true },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    contributions: { type: [contributionSchema], default: [] },
  },
  { timestamps: true },
);

savingsGoalSchema.index({ userId: 1, targetDate: 1 });

export default mongoose.model('SavingsGoal', savingsGoalSchema);
