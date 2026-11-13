import { asyncHandler } from '../utils/asyncHandler.js';
import { answerFinancialQuestion, getInsightData } from '../services/insightService.js';

export const summary = asyncHandler(async (req, res) => {
  res.json({ success: true, insights: await getInsightData(req.user._id, req.validatedQuery?.month) });
});

export const ask = asyncHandler(async (req, res) => {
  res.json({ success: true, response: await answerFinancialQuestion(req.user._id, req.body.question, req.body.month) });
});
