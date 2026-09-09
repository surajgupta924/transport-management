import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as maintenanceService from './maintenance.service.js';

export const listMaintenance = asyncHandler(async (req, res) => {
  const result = await maintenanceService.listMaintenance(req.query);
  return sendSuccess(res, { message: 'Maintenance records fetched', data: result.items, meta: result.meta });
});

export const getMaintenance = asyncHandler(async (req, res) => {
  const record = await maintenanceService.getMaintenanceById(req.params.id);
  return sendSuccess(res, { message: 'Maintenance record fetched', data: record });
});

export const createMaintenance = asyncHandler(async (req, res) => {
  const record = await maintenanceService.createMaintenance(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Maintenance record created', data: record });
});

export const updateMaintenance = asyncHandler(async (req, res) => {
  const record = await maintenanceService.updateMaintenance(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Maintenance record updated', data: record });
});

export const deleteMaintenance = asyncHandler(async (req, res) => {
  const result = await maintenanceService.deleteMaintenance(req.params.id, req.user, req);
  return sendSuccess(res, { message: 'Maintenance record deleted', data: result });
});
