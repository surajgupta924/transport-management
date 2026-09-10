import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as service from './hiredVehicle.service.js';

export const listHiredVehicles = asyncHandler(async (req, res) => {
  const result = await service.listHiredVehicles(req.query);
  return sendSuccess(res, { message: 'Hired vehicles fetched', data: result.items, meta: result.meta });
});

export const hiredDashboard = asyncHandler(async (_req, res) => {
  const data = await service.getDashboard();
  return sendSuccess(res, { message: 'Hired vehicle dashboard', data });
});

export const getHiredVehicle = asyncHandler(async (req, res) => {
  const vehicle = await service.getHiredVehicle(req.params.id);
  return sendSuccess(res, { message: 'Hired vehicle fetched', data: vehicle });
});

export const createHiredVehicle = asyncHandler(async (req, res) => {
  const vehicle = await service.createHiredVehicle(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Hired vehicle registered', data: vehicle });
});

export const updateHiredVehicle = asyncHandler(async (req, res) => {
  const vehicle = await service.updateHiredVehicle(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Hired vehicle updated', data: vehicle });
});

export const deleteHiredVehicle = asyncHandler(async (req, res) => {
  const result = await service.deleteHiredVehicle(req.params.id, req.user, req);
  return sendSuccess(res, { message: 'Hired vehicle deleted', data: result });
});

export const listHiredTrips = asyncHandler(async (req, res) => {
  const result = await service.listHiredTrips(req.query);
  return sendSuccess(res, { message: 'Hired trips fetched', data: result.items, meta: result.meta });
});

export const createHiredTrip = asyncHandler(async (req, res) => {
  const trip = await service.createHiredTrip(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Hired trip recorded', data: trip });
});

export const listHiredPayments = asyncHandler(async (req, res) => {
  const result = await service.listHiredPayments(req.query);
  return sendSuccess(res, { message: 'Hired payments fetched', data: result.items, meta: result.meta });
});

export const createHiredPayment = asyncHandler(async (req, res) => {
  const payment = await service.createHiredPayment(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Hired payment recorded', data: payment });
});
