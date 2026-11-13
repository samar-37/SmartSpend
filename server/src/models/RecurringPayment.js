import mongoose from 'mongoose';

const recurringPaymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    amountMinor: { type: Number, required: true, min: 1 },
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true, trim: true, maxlength: 50 },
    paymentMethod: { type: String, enum: ['cash', 'bank_transfer', 'card', 'upi', 'wallet', 'other'], required: true },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'], required: true },
    interval: { type: Number, min: 1, max: 365, default: 1 },
    intervalUnit: { type: String, enum: ['day', 'week', 'month'], default: 'month' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    timezone: { type: String, default: 'UTC', maxlength: 64 },
    status: { type: String, enum: ['active', 'paused', 'cancelled'], default: 'active', index: true },
    nextOccurrence: { type: Date, default: null },
  },
  { timestamps: true },
);

recurringPaymentSchema.index({ userId: 1, status: 1, nextOccurrence: 1 });

export default mongoose.model('RecurringPayment', recurringPaymentSchema);
