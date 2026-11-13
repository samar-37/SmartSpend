import { asyncHandler } from '../utils/asyncHandler.js';
import { getAnalytics } from '../services/analyticsService.js';

export const analytics = asyncHandler(async (req, res) => {
  res.json({ success: true, analytics: await getAnalytics(req.user._id, req.validatedQuery || req.query) });
});
