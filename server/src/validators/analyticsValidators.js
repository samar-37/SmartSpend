import { z } from 'zod';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD');

export const analyticsQuerySchema = z.object({
  from: date.optional(),
  to: date.optional(),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must use YYYY-MM').optional(),
  year: z.coerce.number().int().min(2000).max(2200).optional(),
  category: z.string().trim().max(50).optional(),
  type: z.enum(['income', 'expense']).optional(),
}).superRefine((value, context) => {
  if (value.from && value.to && value.from > value.to) context.addIssue({ code: 'custom', path: ['to'], message: 'End date must be on or after start date' });
  if (value.month && value.year && Number(value.month.slice(0, 4)) !== value.year) context.addIssue({ code: 'custom', path: ['year'], message: 'Month and year must refer to the same year' });
});
