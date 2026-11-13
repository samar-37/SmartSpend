import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 50 },
    color: { type: String, default: '#4f46e5', match: /^#[0-9a-fA-F]{6}$/ },
    icon: { type: String, default: 'tag', trim: true, maxlength: 32 },
  },
  { timestamps: true },
);

categorySchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model('Category', categorySchema);
