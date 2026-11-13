import { z } from 'zod';

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must use YYYY-MM');

export const insightQuerySchema = z.object({ month: month.optional() });
export const insightQuestionSchema = z.object({
  question: z.string().trim().min(3).max(500),
  month: month.optional(),
});
