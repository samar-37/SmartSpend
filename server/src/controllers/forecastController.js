import { asyncHandler } from '../utils/asyncHandler.js';
import { getForecast } from '../services/forecastService.js';

export const forecast = asyncHandler(async (req, res) => {
  res.json({ success: true, forecast: await getForecast(req.user._id, req.validatedQuery?.month) });
});
