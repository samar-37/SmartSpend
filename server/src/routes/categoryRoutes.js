import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { categorySchema } from '../validators/categoryValidators.js';
import { create, list, remove, update } from '../controllers/categoryController.js';

const router = Router();
router.use(requireAuth);
router.get('/', list);
router.post('/', validate(categorySchema), create);
router.patch('/:id', validate(categorySchema.partial()), update);
router.delete('/:id', remove);
export default router;
