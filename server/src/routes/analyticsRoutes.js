import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateQuery } from '../middleware/validateQuery.js';
import { analyticsQuerySchema } from '../validators/analyticsValidators.js';
import { analytics } from '../controllers/analyticsController.js';

const router = Router();
router.use(requireAuth);
router.get('/', validateQuery(analyticsQuerySchema), analytics);
export default router;
