import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as vendorService from './vendor.service.js';

export const listVendors = asyncHandler(async (req, res) => {
  const result = await vendorService.listVendors(req.query);
  return sendSuccess(res, { message: 'Vendors fetched', data: result.items, meta: result.meta });
});

export const getVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.getVendorById(req.params.id);
  return sendSuccess(res, { message: 'Vendor fetched', data: vendor });
});

export const createVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.createVendor(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Vendor created', data: vendor });
});

export const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.updateVendor(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Vendor updated', data: vendor });
});

export const deleteVendor = asyncHandler(async (req, res) => {
  const result = await vendorService.deleteVendor(req.params.id, req.user, req);
  return sendSuccess(res, { message: 'Vendor deleted', data: result });
});

export const listTransactions = asyncHandler(async (req, res) => {
  const result = await vendorService.listVendorTransactions(req.params.id, req.query);
  return sendSuccess(res, { message: 'Vendor transactions fetched', data: result.items, meta: result.meta });
});

export const addTransaction = asyncHandler(async (req, res) => {
  const txn = await vendorService.addVendorTransaction(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Vendor transaction added', data: txn });
});
