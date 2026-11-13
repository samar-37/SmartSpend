import { z } from 'zod';

const paymentMethods = ['cash', 'bank_transfer', 'card', 'upi', 'wallet', 'other'];
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD').refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Date is not valid');
const base = {
  title: z.string().trim().min(1).max(120),
  amount: z.union([z.string(), z.number()]),
  type: z.enum(['income', 'expense']),
  category: z.string().trim().min(1).max(50),
  paymentMethod: z.enum(paymentMethods),
  notes: z.string().trim().max(500).optional().default(''),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']),
  interval: z.number().int().min(1).max(365).optional().default(1),
  intervalUnit: z.enum(['day', 'week', 'month']).optional().default('month'),
  startDate: date,
  endDate: date.nullable().optional().default(null),
  timezone: z.string().trim().min(1).max(64).optional().default('UTC'),
};

const recurrenceRules = (value, context) => {
  if (value.frequency === 'custom' && !value.intervalUnit) context.addIssue({ code: 'custom', path: ['intervalUnit'], message: 'Custom recurrences require an interval unit' });
  if (value.endDate && value.endDate < value.startDate) context.addIssue({ code: 'custom', path: ['endDate'], message: 'End date must be on or after start date' });
};

export const recurringPaymentSchema = z.object(base).superRefine(recurrenceRules);
export const recurringPaymentUpdateSchema = z.object({
  title: base.title.optional(),
  amount: base.amount.optional(),
  type: base.type.optional(),
  category: base.category.optional(),
  paymentMethod: base.paymentMethod.optional(),
  notes: base.notes.optional(),
  frequency: base.frequency.optional(),
  interval: base.interval,
  intervalUnit: base.intervalUnit,
  startDate: base.startDate.optional(),
  endDate: base.endDate,
  timezone: base.timezone,
}).partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required');
