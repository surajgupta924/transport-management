import { z } from 'zod';

export const upsertSettingSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  group: z.string().optional(),
  description: z.string().optional(),
});

export const bulkUpdateSchema = z.object({
  settings: z.array(upsertSettingSchema).min(1),
});
