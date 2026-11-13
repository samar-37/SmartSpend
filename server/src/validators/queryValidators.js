import { z } from 'zod';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD');
const optionalQuery = (schema) => z.preprocess((value) => value === '' ? undefined : value, schema.optional());

export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: optionalQuery(z.string().trim().max(100)),
  type: optionalQuery(z.enum(['income', 'expense'])),
  source: optionalQuery(z.enum(['manual', 'recurring'])),
  category: optionalQuery(z.string().trim().max(50)),
  paymentMethod: optionalQuery(z.enum(['cash', 'bank_transfer', 'card', 'upi', 'wallet', 'other'])),
  from: optionalQuery(date),
  to: optionalQuery(date),
  minAmount: optionalQuery(z.coerce.number().finite().min(0)),
  maxAmount: optionalQuery(z.coerce.number().finite().min(0)),
  sortBy: z.enum(['date', 'amountMinor', 'createdAt', 'title']).default('date'),
  order: z.enum(['asc', 'desc']).default('desc'),
}).superRefine((value, context) => {
  if (value.from && value.to && value.from > value.to) context.addIssue({ code: 'custom', path: ['to'], message: 'End date must be on or after start date' });
  if (value.minAmount !== undefined && value.maxAmount !== undefined && value.minAmount > value.maxAmount) context.addIssue({ code: 'custom', path: ['maxAmount'], message: 'Maximum amount must be at least minimum amount' });
});
