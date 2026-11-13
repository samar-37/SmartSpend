import mongoose from 'mongoose';

const forecastSnapshotSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetMonth: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    forecast: { type: mongoose.Schema.Types.Mixed, required: true },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

forecastSnapshotSchema.index({ userId: 1, targetMonth: 1 }, { unique: true });

export default mongoose.model('ForecastSnapshot', forecastSnapshotSchema);
