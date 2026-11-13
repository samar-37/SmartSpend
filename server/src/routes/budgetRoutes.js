import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { budgetSchema, budgetUpdateSchema } from '../validators/budgetValidators.js';
import { create, history, list, remove, update } from '../controllers/budgetController.js';

const router = Router();
router.use(requireAuth);
router.get('/history', history);
router.get('/', list);
router.post('/', validate(budgetSchema), create);
router.patch('/:id', validate(budgetUpdateSchema), update);
router.delete('/:id', remove);
export default router;
