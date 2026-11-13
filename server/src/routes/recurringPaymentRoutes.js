import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { cancel, create, history, list, pause, record, resume, skip, upcoming, update } from '../controllers/recurringPaymentController.js';
import { recurringPaymentSchema, recurringPaymentUpdateSchema } from '../validators/recurringPaymentValidators.js';

const router = Router();
router.use(requireAuth);
router.get('/upcoming', upcoming);
router.get('/', list);
router.post('/', validate(recurringPaymentSchema), create);
router.patch('/:id', validate(recurringPaymentUpdateSchema), update);
router.post('/:id/pause', pause);
router.post('/:id/resume', resume);
router.post('/:id/cancel', cancel);
router.get('/:id/history', history);
router.post('/:id/occurrences/:date', record);
router.post('/:id/occurrences/:date/skip', skip);
export default router;
