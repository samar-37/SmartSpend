import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    currency: { type: String, default: 'INR', trim: true, maxlength: 3 },
    timezone: { type: String, default: 'Asia/Kolkata', trim: true, maxlength: 64 },
    avatarUrl: { type: String, default: '', trim: true, maxlength: 512 },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    profile: { type: profileSchema, default: () => ({}) },
    refreshTokenHash: { type: String, select: false, default: null },
    refreshTokenExpiresAt: { type: Date, select: false, default: null },
  },
  { timestamps: true },
);

export default mongoose.model('User', userSchema);
