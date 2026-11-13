import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { notificationPreferenceSchema } from '../validators/notificationValidators.js';
import { activeBudgetAlerts, list, markRead, markAllRead, remove, preferences, updatePreferences } from '../controllers/notificationController.js';

const router = Router();
router.use(requireAuth);
router.get('/', list);
router.get('/budget-alerts', activeBudgetAlerts);
router.patch('/:id/read', markRead);
router.post('/read-all', markAllRead);
router.delete('/:id', remove);
router.get('/preferences', preferences);
router.patch('/preferences', validate(notificationPreferenceSchema), updatePreferences);
export default router;
