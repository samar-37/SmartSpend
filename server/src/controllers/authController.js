import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { createNotification } from '../services/notificationService.js';
import {
  ACCESS_COOKIE, CSRF_COOKIE, REFRESH_COOKIE, cookieOptions, createAccessToken,
  createCsrfToken, createRefreshToken, csrfCookieOptions, hashToken, publicUser,
} from '../utils/auth.js';

const refreshMaxAge = 7 * 24 * 60 * 60 * 1000;

function setSessionCookies(res, userId) {
  const accessToken = createAccessToken(userId);
  const refreshToken = createRefreshToken(userId);
  const csrfToken = createCsrfToken();
  res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(refreshMaxAge));
  res.cookie(CSRF_COOKIE, csrfToken, csrfCookieOptions());
  return refreshToken;
}

export function csrf(req, res) {
  const token = createCsrfToken();
  res.cookie(CSRF_COOKIE, token, csrfCookieOptions());
  res.json({ success: true });
}

export async function register(req, res) {
  const { name, email, password } = req.body;
  const existingUser = await User.exists({ email });
  if (existingUser) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 409;
    throw error;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });
  const refreshToken = setSessionCookies(res, user._id.toString());
  await User.updateOne({ _id: user._id }, {
    refreshTokenHash: hashToken(refreshToken),
    refreshTokenExpiresAt: new Date(Date.now() + refreshMaxAge),
  });
  await createNotification({
    userId: user._id,
    type: 'account_event',
    title: 'Welcome to SmartSpend',
    message: 'Your account is ready. Enable notification preferences to receive helpful reminders.',
    dedupeKey: `account:welcome:${user._id}`,
  });
  res.status(201).json({ success: true, user: publicUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash +refreshTokenHash +refreshTokenExpiresAt');
  const validPassword = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!validPassword) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }
  const refreshToken = setSessionCookies(res, user._id.toString());
  user.refreshTokenHash = hashToken(refreshToken);
  user.refreshTokenExpiresAt = new Date(Date.now() + refreshMaxAge);
  await user.save();
  await createNotification({
    userId: user._id,
    type: 'account_event',
    title: 'New sign-in',
    message: 'Your SmartSpend account was signed in successfully.',
    dedupeKey: `account:login:${user._id}:${new Date().toISOString().slice(0, 10)}`,
  });
  res.json({ success: true, user: publicUser(user) });
}

export async function refresh(req, res) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    const error = new Error('Refresh session required');
    error.statusCode = 401;
    throw error;
  }
  let payload;
  try {
    payload = jwt.verify(token, env.jwtRefreshSecret);
  } catch {
    const error = new Error('Refresh session expired');
    error.statusCode = 401;
    throw error;
  }
  const user = await User.findById(payload.sub).select('+refreshTokenHash +refreshTokenExpiresAt');
  if (!user || user.refreshTokenHash !== hashToken(token) || user.refreshTokenExpiresAt < new Date()) {
    const error = new Error('Refresh session invalid');
    error.statusCode = 401;
    throw error;
  }
  const nextRefreshToken = setSessionCookies(res, user._id.toString());
  user.refreshTokenHash = hashToken(nextRefreshToken);
  user.refreshTokenExpiresAt = new Date(Date.now() + refreshMaxAge);
  await user.save();
  res.json({ success: true, user: publicUser(user) });
}

export async function logout(req, res) {
  if (req.user) await User.updateOne({ _id: req.user._id }, { $set: { refreshTokenHash: null, refreshTokenExpiresAt: null } });
  res.clearCookie(ACCESS_COOKIE, cookieOptions(0));
  res.clearCookie(REFRESH_COOKIE, cookieOptions(0));
  res.clearCookie(CSRF_COOKIE, csrfCookieOptions());
  res.json({ success: true });
}

export function me(req, res) {
  res.json({ success: true, user: publicUser(req.user) });
}
