import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import {
  ACCESS_COOKIE, CSRF_COOKIE, REFRESH_COOKIE, cookieOptions, csrfCookieOptions, publicUser,
} from '../utils/auth.js';

export async function updateProfile(req, res) {
  const updates = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.profile !== undefined) {
    for (const [key, value] of Object.entries(req.body.profile)) updates[`profile.${key}`] = value;
  }
  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
  res.json({ success: true, user: publicUser(user) });
}

export async function changePassword(req, res) {
  const user = await User.findById(req.user._id).select('+passwordHash');
  const validPassword = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
  if (!validPassword) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 401;
    throw error;
  }
  user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  user.refreshTokenHash = null;
  user.refreshTokenExpiresAt = null;
  await user.save();
  res.clearCookie(ACCESS_COOKIE, cookieOptions(0));
  res.clearCookie(REFRESH_COOKIE, cookieOptions(0));
  res.clearCookie(CSRF_COOKIE, csrfCookieOptions());
  res.json({ success: true, message: 'Password changed. Please sign in again.' });
}
