import crypto from 'node:crypto';
import { Setting } from '../settings/setting.model.js';
import { Vehicle } from '../vehicles/vehicle.model.js';
import { Trip, ACTIVE_TRIP_STATUSES } from '../trips/trip.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { upsertSetting } from '../settings/setting.service.js';
import * as trackingService from '../tracking/tracking.service.js';

const KEYS = {
  provider: 'gps.provider',
  mobileFallbackDelay: 'gps.mobileFallbackDelay',
  truckGpsEnabled: 'gps.truckGpsEnabled',
  webhookToken: 'gps.webhookToken',
};

export async function getGpsSetup() {
  const items = await Setting.find({ key: { $in: Object.values(KEYS) } });
  const map = Object.fromEntries(items.map((s) => [s.key, s.value]));
  const token = map[KEYS.webhookToken] || '';
  return {
    provider: map[KEYS.provider] || 'GENERIC',
    mobileFallbackDelay: Number(map[KEYS.mobileFallbackDelay] || 90),
    truckGpsEnabled: map[KEYS.truckGpsEnabled] === true || map[KEYS.truckGpsEnabled] === 'true',
    webhookToken: token,
    webhookPath: '/api/v1/gps/webhook',
    connected: Boolean(token),
  };
}

export async function saveGpsSetup(payload, actor, req) {
  const updates = [
    { key: KEYS.provider, value: payload.provider || 'GENERIC', group: 'gps', description: 'GPS provider name' },
    {
      key: KEYS.mobileFallbackDelay,
      value: Number(payload.mobileFallbackDelay ?? 90),
      group: 'gps',
      description: 'Seconds before driver mobile GPS is used',
    },
    {
      key: KEYS.truckGpsEnabled,
      value: Boolean(payload.truckGpsEnabled),
      group: 'gps',
      description: 'Enable truck GPS integration',
    },
  ];
  for (const item of updates) {
    await upsertSetting(item, actor, req);
  }
  return getGpsSetup();
}

export async function generateWebhookToken(actor, req) {
  const token = crypto.randomBytes(24).toString('hex');
  await upsertSetting(
    { key: KEYS.webhookToken, value: token, group: 'gps', description: 'Provider webhook token' },
    actor,
    req
  );
  return getGpsSetup();
}

export async function ingestWebhook(headers, body) {
  const setup = await getGpsSetup();
  if (!setup.truckGpsEnabled) {
    throw new ApiError(403, 'Truck GPS integration is disabled');
  }
  const headerToken = headers['x-gps-token'] || headers['X-GPS-Token'] || body?.token;
  if (!setup.webhookToken || headerToken !== setup.webhookToken) {
    throw new ApiError(401, 'Invalid GPS token');
  }

  const deviceId = String(body.device_id || body.deviceId || body.imei || '').trim();
  const lat = Number(body.latitude ?? body.lat);
  const lng = Number(body.longitude ?? body.lng);
  if (!deviceId || Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new ApiError(400, 'device_id, latitude and longitude are required');
  }

  const vehicle = await Vehicle.findOne({ gpsDeviceId: deviceId.toUpperCase() });
  if (!vehicle) throw new ApiError(404, 'No vehicle mapped to this GPS device ID');

  const trip = await Trip.findOne({
    vehicle: vehicle._id,
    status: { $in: ACTIVE_TRIP_STATUSES },
  }).sort({ updatedAt: -1 });
  if (!trip) throw new ApiError(404, 'No active trip for this vehicle');

  const result = await trackingService.recordLocation(trip._id, {
    lat,
    lng,
    speed: body.speed != null ? Number(body.speed) : undefined,
    heading: body.heading != null ? Number(body.heading) : undefined,
    accuracy: body.accuracy != null ? Number(body.accuracy) : undefined,
    timestamp: body.timestamp,
    source: 'VEHICLE_GPS',
  });

  return {
    accepted: true,
    tripId: trip._id,
    tripNumber: trip.tripNumber,
    vehicle: vehicle.registrationNumber,
    throttled: result.throttled,
    eventId: body.event_id || body.eventId || null,
  };
}
