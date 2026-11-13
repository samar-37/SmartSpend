import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    amountMinor: { type: Number, required: true, min: 1 },
    type: { type: String, enum: ['income', 'expense'], required: true, index: true },
    category: { type: String, required: true, trim: true, maxlength: 50, index: true },
    date: { type: Date, required: true, index: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'card', 'upi', 'wallet', 'other'],
      required: true,
    },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
    recurringPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecurringPayment', index: true },
    recurringOccurrenceDate: { type: Date },
  },
  { timestamps: true },
);

transactionSchema.index({ userId: 1, date: -1, createdAt: -1 });
transactionSchema.index({ userId: 1, type: 1, category: 1 });
transactionSchema.index(
  { userId: 1, recurringPaymentId: 1, recurringOccurrenceDate: 1 },
  { unique: true, partialFilterExpression: { recurringPaymentId: { $exists: true }, recurringOccurrenceDate: { $exists: true } } },
);

export default mongoose.model('Transaction', transactionSchema);
