import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as tripService from './trip.service.js';
import * as trackingService from '../tracking/tracking.service.js';

export const listTrips = asyncHandler(async (req, res) => {
  const result = await tripService.listTrips(req.query, req.user);
  return sendSuccess(res, { message: 'Trips fetched', data: result.items, meta: result.meta });
});

export const getTrip = asyncHandler(async (req, res) => {
  const trip = await tripService.getTripById(req.params.id);
  return sendSuccess(res, { message: 'Trip fetched', data: trip });
});

export const createTrip = asyncHandler(async (req, res) => {
  const trip = await tripService.createTrip(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Trip created', data: trip });
});

export const assignTrip = asyncHandler(async (req, res) => {
  const trip = await tripService.assignTrip(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Trip assigned', data: trip });
});

export const updateTrip = asyncHandler(async (req, res) => {
  const trip = await tripService.updateTrip(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Trip updated', data: trip });
});

export const transitionTrip = asyncHandler(async (req, res) => {
  const trip = await tripService.transitionTrip(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Trip status updated', data: trip });
});

export const getTripTrack = asyncHandler(async (req, res) => {
  const history = await trackingService.getTripHistory(req.params.id, req.query);
  return sendSuccess(res, { message: 'Trip tracking history', data: history.items, meta: history.meta });
});

export const postTripLocation = asyncHandler(async (req, res) => {
  const result = await trackingService.recordLocation(req.params.id, {
    lat: req.body.lat,
    lng: req.body.lng,
    accuracy: req.body.accuracy,
    speed: req.body.speed,
    heading: req.body.heading,
    timestamp: req.body.timestamp || req.body.ts,
    source: req.body.source || 'DRIVER_MOBILE',
  });
  return sendSuccess(res, {
    message: result.throttled ? 'Location accepted (throttled)' : 'Location recorded',
    data: { lastLocation: result.trip.lastLocation, throttled: result.throttled },
  });
});

export const setTripSharing = asyncHandler(async (req, res) => {
  const trip = await trackingService.setLocationSharing(req.params.id, req.body.sharing);
  return sendSuccess(res, { message: trip.locationSharing ? 'Live GPS on' : 'Live GPS off', data: trip });
});

export const assignmentBoard = asyncHandler(async (_req, res) => {
  const data = await tripService.assignmentBoard();
  return sendSuccess(res, { message: 'Assignment board', data });
});

export const assignShipment = asyncHandler(async (req, res) => {
  const trip = await tripService.assignShipment(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Shipment assigned', data: trip });
});

export const acceptAssignment = asyncHandler(async (req, res) => {
  const trip = await tripService.acceptAssignment(req.params.id, req.user, req);
  return sendSuccess(res, { message: 'Assignment accepted', data: trip });
});

export const rejectAssignment = asyncHandler(async (req, res) => {
  const trip = await tripService.rejectAssignment(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Assignment rejected', data: trip });
});

export const releaseAssignment = asyncHandler(async (req, res) => {
  const trip = await tripService.releaseAssignment(req.params.id, req.user, req);
  return sendSuccess(res, { message: 'Assignment released', data: trip });
});
