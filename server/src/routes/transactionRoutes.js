import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { validateQuery } from '../middleware/validateQuery.js';
import { transactionQuerySchema } from '../validators/queryValidators.js';
import { transactionSchema, transactionUpdateSchema } from '../validators/transactionValidators.js';
import { create, dashboard, getOne, list, remove, summary, update } from '../controllers/transactionController.js';

const router = Router();
router.use(requireAuth);
router.get('/summary', summary);
router.get('/dashboard', dashboard);
router.get('/', validateQuery(transactionQuerySchema), list);
router.post('/', validate(transactionSchema), create);
router.get('/:id', getOne);
router.patch('/:id', validate(transactionUpdateSchema), update);
router.delete('/:id', remove);
export default router;
