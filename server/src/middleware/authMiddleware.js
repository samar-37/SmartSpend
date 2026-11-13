import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ACCESS_COOKIE } from '../utils/auth.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }
  let payload;
  try {
    payload = jwt.verify(token, env.jwtAccessSecret);
  } catch {
    const error = new Error('Invalid or expired session');
    error.statusCode = 401;
    throw error;
  }
  if (payload.type !== 'access') {
    const error = new Error('Invalid session');
    error.statusCode = 401;
    throw error;
  }
  const user = await User.findById(payload.sub);
  if (!user) {
    const error = new Error('User account not found');
    error.statusCode = 401;
    throw error;
  }
  req.user = user;
  next();
});
