import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { csrf, login, logout, me, refresh, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registrationSchema } from '../validators/authValidators.js';

const router = Router();
router.get('/csrf', csrf);
router.post('/register', validate(registrationSchema), asyncHandler(register));
router.post('/login', validate(loginSchema), asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', requireAuth, asyncHandler(logout));
router.get('/me', requireAuth, me);
export default router;
