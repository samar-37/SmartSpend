import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const ACCESS_COOKIE = 'smartspend_access';
export const REFRESH_COOKIE = 'smartspend_refresh';
export const CSRF_COOKIE = 'smartspend_csrf';

export function createAccessToken(userId) {
  return jwt.sign({ sub: userId, type: 'access' }, env.jwtAccessSecret, { expiresIn: '15m' });
}

export function createRefreshToken(userId) {
  return jwt.sign({ sub: userId, type: 'refresh', nonce: crypto.randomUUID() }, env.jwtRefreshSecret, { expiresIn: '7d' });
}

export function createCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'strict' : 'lax',
    path: '/',
    maxAge,
  };
}

export function csrfCookieOptions() {
  return {
    httpOnly: false,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'strict' : 'lax',
    path: '/',
  };
}

export function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    profile: user.profile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
