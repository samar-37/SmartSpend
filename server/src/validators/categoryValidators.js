import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default('#4f46e5'),
  icon: z.string().trim().min(1).max(32).optional().default('tag'),
});
