import { TripLocation } from './tripLocation.model.js';
import { Trip, ACTIVE_TRIP_STATUSES } from '../trips/trip.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { env } from '../../config/env.js';

// In-memory throttle map: tripId -> last write timestamp
const lastWriteAt = new Map();

/**
 * Record a location update. Callers (HTTP or socket) should expect throttling:
 * writes within LOCATION_THROTTLE_MS are skipped (still update trip.lastLocation).
 * Prefer batching from the client; server also throttles to reduce write load.
 */
export async function recordLocation(tripId, point, { force = false } = {}) {
  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, 'Trip not found');
  if (!ACTIVE_TRIP_STATUSES.includes(trip.status)) {
    throw new ApiError(400, 'Trip is not active for tracking');
  }

  const now = Date.now();
  const last = lastWriteAt.get(String(tripId)) || 0;
  const throttled = !force && now - last < env.locationThrottleMs;

  trip.lastLocation = {
    lat: point.lat,
    lng: point.lng,
    speed: point.speed,
    heading: point.heading,
    accuracy: point.accuracy,
    source: point.source || 'DRIVER_MOBILE',
    updatedAt: new Date(),
  };
  trip.locationSharing = true;
  await trip.save();

  if (throttled) {
    return { trip, location: null, throttled: true };
  }

  lastWriteAt.set(String(tripId), now);
  const location = await TripLocation.create({
    trip: tripId,
    lat: point.lat,
    lng: point.lng,
    accuracy: point.accuracy,
    speed: point.speed,
    heading: point.heading,
    timestamp: point.timestamp ? new Date(point.timestamp) : new Date(),
  });

  return { trip, location, throttled: false };
}

/** Batch insert multiple points (e.g. reconnect flush). Still updates lastLocation from newest. */
export async function recordLocationBatch(tripId, points = []) {
  if (!points.length) return { inserted: 0 };
  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, 'Trip not found');

  const docs = points.map((p) => ({
    trip: tripId,
    lat: p.lat,
    lng: p.lng,
    accuracy: p.accuracy,
    speed: p.speed,
    heading: p.heading,
    timestamp: p.timestamp ? new Date(p.timestamp) : new Date(),
  }));

  const result = await TripLocation.insertMany(docs, { ordered: false });
  const newest = docs.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
  trip.lastLocation = {
    lat: newest.lat,
    lng: newest.lng,
    speed: newest.speed,
    heading: newest.heading,
    accuracy: newest.accuracy,
    source: newest.source || 'DRIVER_MOBILE',
    updatedAt: newest.timestamp,
  };
  trip.locationSharing = true;
  await trip.save();
  lastWriteAt.set(String(tripId), Date.now());
  return { inserted: result.length, lastLocation: trip.lastLocation };
}

export async function getTripHistory(tripId, query = {}) {
  const trip = await Trip.findById(tripId).select('_id tripNumber lastLocation status');
  if (!trip) throw new ApiError(404, 'Trip not found');

  const { page, limit, skip, sort } = parsePagination(query, { defaultLimit: 200, maxLimit: 1000 });
  const filter = { trip: tripId };
  if (query.from || query.to) {
    filter.timestamp = {};
    if (query.from) filter.timestamp.$gte = new Date(query.from);
    if (query.to) filter.timestamp.$lte = new Date(query.to);
  }

  const [items, total] = await Promise.all([
    TripLocation.find(filter).sort(sort.timestamp ? sort : { timestamp: -1 }).skip(skip).limit(limit),
    TripLocation.countDocuments(filter),
  ]);

  return {
    items,
    meta: { ...buildMeta({ page, limit, total }), trip: { id: trip._id, tripNumber: trip.tripNumber, lastLocation: trip.lastLocation, status: trip.status } },
  };
}

export async function setLocationSharing(tripId, sharing) {
  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, 'Trip not found');
  trip.locationSharing = Boolean(sharing);
  await trip.save();
  return trip;
}
