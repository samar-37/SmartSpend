import { z } from 'zod';

export const registrationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  profile: z.object({
    currency: z.string().trim().length(3).optional(),
    timezone: z.string().trim().min(1).max(64).optional(),
    avatarUrl: z.string().trim().url().max(512).or(z.literal('')).optional(),
  }).optional(),
}).refine((value) => value.name !== undefined || value.profile !== undefined, 'At least one profile field is required');

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});
