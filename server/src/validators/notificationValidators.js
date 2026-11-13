import { z } from 'zod';

export const notificationPreferenceSchema = z.object({
  consentGranted: z.boolean().optional(),
  recurringPayment: z.boolean().optional(),
  budgetWarning: z.boolean().optional(),
  budgetWarning75: z.boolean().optional(),
  budgetWarning90: z.boolean().optional(),
  budgetExceeded: z.boolean().optional(),
  savingsMilestone: z.boolean().optional(),
  monthlySummary: z.boolean().optional(),
  accountEvent: z.boolean().optional(),
}).strict();