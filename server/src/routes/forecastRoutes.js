import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateQuery } from '../middleware/validateQuery.js';
import { forecast } from '../controllers/forecastController.js';
import { forecastQuerySchema } from '../validators/forecastValidators.js';

const router = Router();
router.use(requireAuth);
router.get('/', validateQuery(forecastQuerySchema), forecast);
export default router;
