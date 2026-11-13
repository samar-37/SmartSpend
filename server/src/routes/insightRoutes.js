import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { validateQuery } from '../middleware/validateQuery.js';
import { ask, summary } from '../controllers/insightController.js';
import { insightQuerySchema, insightQuestionSchema } from '../validators/insightValidators.js';

const router = Router();
router.use(requireAuth);
router.get('/summary', validateQuery(insightQuerySchema), summary);
router.post('/ask', validate(insightQuestionSchema), ask);
export default router;
