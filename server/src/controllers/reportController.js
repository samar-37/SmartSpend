import { asyncHandler } from '../utils/asyncHandler.js';
import { streamCsv, streamPdf } from '../services/reportService.js';

export const csv = asyncHandler(async (req, res) => streamCsv(req.user._id, req.validatedQuery || req.query, res));
export const pdf = asyncHandler(async (req, res) => streamPdf(req.user._id, req.validatedQuery || req.query, res));
