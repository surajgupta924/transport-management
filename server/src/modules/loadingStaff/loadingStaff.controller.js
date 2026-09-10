import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as service from './loadingStaff.service.js';

export const listLoadingStaff = asyncHandler(async (req, res) => {
  const result = await service.listLoadingStaff(req.query);
  return sendSuccess(res, { message: 'Loading staff fetched', data: result.items, meta: result.meta });
});

export const getLoadingStaff = asyncHandler(async (req, res) => {
  const staff = await service.getLoadingStaffById(req.params.id);
  return sendSuccess(res, { message: 'Loading staff fetched', data: staff });
});

export const createLoadingStaff = asyncHandler(async (req, res) => {
  const staff = await service.createLoadingStaff(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Loading staff added', data: staff });
});

export const updateLoadingStaff = asyncHandler(async (req, res) => {
  const staff = await service.updateLoadingStaff(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Loading staff updated', data: staff });
});
