import { z } from 'zod';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD').refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Date is not valid');

export const reportQuerySchema = z.object({
  from: date.optional(),
  to: date.optional(),
  type: z.enum(['income', 'expense']).optional(),
  source: z.enum(['manual', 'recurring']).optional(),
  category: z.string().trim().min(1).max(50).optional(),
}).superRefine((value, context) => {
  if (value.from && value.to && value.from > value.to) context.addIssue({ code: 'custom', path: ['to'], message: 'End date must be on or after start date' });
});
