import mongoose from 'mongoose';

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    consentGranted: { type: Boolean, default: false },
    recurringPayment: { type: Boolean, default: true },
    budgetWarning: { type: Boolean, default: true },
    budgetWarning75: { type: Boolean, default: true },
    budgetWarning90: { type: Boolean, default: true },
    budgetExceeded: { type: Boolean, default: true },
    savingsMilestone: { type: Boolean, default: true },
    monthlySummary: { type: Boolean, default: true },
    accountEvent: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model('NotificationPreference', notificationPreferenceSchema);
