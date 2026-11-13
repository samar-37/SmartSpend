import mongoose from 'mongoose';

const recurringOccurrenceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recurringPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecurringPayment', required: true, index: true },
    occurrenceDate: { type: Date, required: true },
    status: { type: String, enum: ['scheduled', 'processing', 'processed', 'failed', 'skipped', 'deleted'], default: 'scheduled', index: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', default: null },
    failureReason: { type: String, trim: true, maxlength: 500, default: '' },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

recurringOccurrenceSchema.index({ userId: 1, recurringPaymentId: 1, occurrenceDate: 1 }, { unique: true });

export default mongoose.model('RecurringOccurrence', recurringOccurrenceSchema);
