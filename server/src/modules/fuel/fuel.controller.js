import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as fuelService from './fuel.service.js';

export const listFuel = asyncHandler(async (req, res) => {
  const result = await fuelService.listFuel(req.query);
  return sendSuccess(res, { message: 'Fuel records fetched', data: result.items, meta: result.meta });
});

export const getFuel = asyncHandler(async (req, res) => {
  const record = await fuelService.getFuelById(req.params.id);
  return sendSuccess(res, { message: 'Fuel record fetched', data: record });
});

export const createFuel = asyncHandler(async (req, res) => {
  const record = await fuelService.createFuel(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Fuel record created', data: record });
});

export const updateFuel = asyncHandler(async (req, res) => {
  const record = await fuelService.updateFuel(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Fuel record updated', data: record });
});

export const deleteFuel = asyncHandler(async (req, res) => {
  const result = await fuelService.deleteFuel(req.params.id, req.user, req);
  return sendSuccess(res, { message: 'Fuel record deleted', data: result });
});
