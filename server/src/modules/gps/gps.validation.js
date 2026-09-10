import { z } from 'zod';

export const saveGpsSetupSchema = z.object({
  provider: z.string().min(1).optional(),
  mobileFallbackDelay: z.coerce.number().int().min(0).max(3600).optional(),
  truckGpsEnabled: z.coerce.boolean().optional(),
});

export const gpsWebhookSchema = z
  .object({
    device_id: z.union([z.string(), z.number()]).optional(),
    deviceId: z.union([z.string(), z.number()]).optional(),
    imei: z.union([z.string(), z.number()]).optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    speed: z.coerce.number().optional(),
    heading: z.coerce.number().optional(),
    accuracy: z.coerce.number().optional(),
    timestamp: z.union([z.string(), z.coerce.date(), z.coerce.number()]).optional(),
    event_id: z.union([z.string(), z.number()]).optional(),
    eventId: z.union([z.string(), z.number()]).optional(),
    token: z.string().optional(),
  })
  .passthrough();
