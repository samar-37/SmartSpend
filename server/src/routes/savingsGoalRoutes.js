import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { contributionSchema, savingsGoalSchema, savingsGoalUpdateSchema } from '../validators/savingsGoalValidators.js';
import { contribute, create, getOne, list, remove, removeContribution, update } from '../controllers/savingsGoalController.js';

const router = Router();
router.use(requireAuth);
router.get('/', list);
router.post('/', validate(savingsGoalSchema), create);
router.get('/:id', getOne);
router.patch('/:id', validate(savingsGoalUpdateSchema), update);
router.delete('/:id', remove);
router.post('/:id/contributions', validate(contributionSchema), contribute);
router.delete('/:id/contributions/:contributionId', removeContribution);
export default router;
