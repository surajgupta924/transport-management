import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as driverService from './driver.service.js';

export const listDrivers = asyncHandler(async (req, res) => {
  const result = await driverService.listDrivers(req.query);
  return sendSuccess(res, { message: 'Drivers fetched', data: result.items, meta: result.meta });
});

export const getDriver = asyncHandler(async (req, res) => {
  const driver = await driverService.getDriverById(req.params.id);
  return sendSuccess(res, { message: 'Driver fetched', data: driver });
});

export const createDriver = asyncHandler(async (req, res) => {
  const driver = await driverService.createDriver(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Driver created', data: driver });
});

export const updateDriver = asyncHandler(async (req, res) => {
  const driver = await driverService.updateDriver(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Driver updated', data: driver });
});

export const deleteDriver = asyncHandler(async (req, res) => {
  const result = await driverService.deleteDriver(req.params.id, req.user, req);
  return sendSuccess(res, { message: 'Driver deleted', data: result });
});

export const listDocuments = asyncHandler(async (req, res) => {
  const docs = await driverService.listDocuments(req.params.id);
  return sendSuccess(res, { message: 'Driver documents fetched', data: docs });
});

export const addDocument = asyncHandler(async (req, res) => {
  const doc = await driverService.addDocument(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Document added', data: doc });
});

export const updateDocument = asyncHandler(async (req, res) => {
  const doc = await driverService.updateDocument(req.params.id, req.params.docId, req.body, req.user, req);
  return sendSuccess(res, { message: 'Document updated', data: doc });
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const result = await driverService.deleteDocument(req.params.id, req.params.docId);
  return sendSuccess(res, { message: 'Document deleted', data: result });
});
