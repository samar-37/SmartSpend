import { z } from 'zod';

const paymentMethods = ['cash', 'bank_transfer', 'card', 'upi', 'wallet', 'other'];
const base = {
  title: z.string().trim().min(1).max(120),
  amount: z.union([z.string(), z.number()]),
  type: z.enum(['income', 'expense']),
  category: z.string().trim().min(1).max(50),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD'),
  paymentMethod: z.enum(paymentMethods),
  notes: z.string().trim().max(500).optional().default(''),
};

export const transactionSchema = z.object(base);
export const transactionUpdateSchema = z.object({
  title: base.title.optional(),
  amount: base.amount.optional(),
  type: base.type.optional(),
  category: base.category.optional(),
  date: base.date.optional(),
  paymentMethod: base.paymentMethod.optional(),
  notes: base.notes.optional(),
}).refine((value) => Object.keys(value).length > 0, 'At least one field is required');
