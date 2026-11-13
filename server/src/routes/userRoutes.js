import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { changePassword, updateProfile } from '../controllers/userController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { passwordChangeSchema, profileSchema } from '../validators/authValidators.js';

const router = Router();
router.patch('/profile', requireAuth, validate(profileSchema), asyncHandler(updateProfile));
router.patch('/password', requireAuth, validate(passwordChangeSchema), asyncHandler(changePassword));
export default router;
