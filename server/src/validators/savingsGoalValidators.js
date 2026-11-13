import { z } from 'zod';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD').refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Date is not valid');
const amount = z.union([z.string(), z.number()]);

export const savingsGoalSchema = z.object({
  name: z.string().trim().min(1).max(120),
  targetAmount: amount,
  targetDate: date,
  description: z.string().trim().max(500).optional().default(''),
});

export const savingsGoalUpdateSchema = savingsGoalSchema.partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export const contributionSchema = z.object({
  amount: amount,
  date: date,
  note: z.string().trim().max(300).optional().default(''),
});
