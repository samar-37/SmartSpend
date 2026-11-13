import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateQuery } from '../middleware/validateQuery.js';
import { reportQuerySchema } from '../validators/reportValidators.js';
import { csv, pdf } from '../controllers/reportController.js';

const router = Router();
router.use(requireAuth);
router.get('/csv', validateQuery(reportQuerySchema), csv);
router.get('/pdf', validateQuery(reportQuerySchema), pdf);
export default router;
