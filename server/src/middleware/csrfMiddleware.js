import { CSRF_COOKIE } from '../utils/auth.js';

export function requireCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get('x-csrf-token');
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    const error = new Error('Invalid CSRF token');
    error.statusCode = 403;
    return next(error);
  }
  return next();
}
