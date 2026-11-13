import { z } from 'zod';

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must use YYYY-MM');

export const forecastQuerySchema = z.object({ month: month.optional() });
