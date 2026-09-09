import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as vehicleService from './vehicle.service.js';

export const listVehicles = asyncHandler(async (req, res) => {
  const result = await vehicleService.listVehicles(req.query);
  return sendSuccess(res, { message: 'Vehicles fetched', data: result.items, meta: result.meta });
});

export const getVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.getVehicleById(req.params.id);
  return sendSuccess(res, { message: 'Vehicle fetched', data: vehicle });
});

export const createVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.createVehicle(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Vehicle created', data: vehicle });
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.updateVehicle(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Vehicle updated', data: vehicle });
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  const result = await vehicleService.deleteVehicle(req.params.id, req.user, req);
  return sendSuccess(res, { message: 'Vehicle deleted', data: result });
});

export const listDocuments = asyncHandler(async (req, res) => {
  const docs = await vehicleService.listDocuments(req.params.id);
  return sendSuccess(res, { message: 'Vehicle documents fetched', data: docs });
});

export const addDocument = asyncHandler(async (req, res) => {
  const doc = await vehicleService.addDocument(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Document added', data: doc });
});

export const updateDocument = asyncHandler(async (req, res) => {
  const doc = await vehicleService.updateDocument(req.params.id, req.params.docId, req.body, req.user, req);
  return sendSuccess(res, { message: 'Document updated', data: doc });
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const result = await vehicleService.deleteDocument(req.params.id, req.params.docId, req.user, req);
  return sendSuccess(res, { message: 'Document deleted', data: result });
});
