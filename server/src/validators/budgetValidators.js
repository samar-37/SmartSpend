import { z } from 'zod';

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must use YYYY-MM');
const amount = z.union([z.string(), z.number()]);
const thresholds = z.array(z.number().int().min(1).max(100)).length(3).refine((value) => value[0] < value[1] && value[1] < value[2], 'Thresholds must be increasing');

export const budgetSchema = z.object({
  month,
  category: z.string().trim().min(1).max(50).nullable().optional().default(null),
  amount,
  warningThresholds: thresholds.optional().default([75, 90, 100]),
});

export const budgetUpdateSchema = z.object({
  amount: amount.optional(),
  warningThresholds: thresholds.optional(),
}).refine((value) => Object.keys(value).length > 0, 'At least one field is required');
