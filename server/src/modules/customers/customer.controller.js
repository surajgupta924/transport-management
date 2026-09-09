import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as customerService from './customer.service.js';

export const listCustomers = asyncHandler(async (req, res) => {
  const result = await customerService.listCustomers(req.query);
  return sendSuccess(res, { message: 'Customers fetched', data: result.items, meta: result.meta });
});

export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  return sendSuccess(res, { message: 'Customer fetched', data: customer });
});

export const createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Customer created', data: customer });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Customer updated', data: customer });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const result = await customerService.deleteCustomer(req.params.id, req.user, req);
  return sendSuccess(res, { message: 'Customer deleted', data: result });
});

export const invitePortal = asyncHandler(async (req, res) => {
  const result = await customerService.invitePortal(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Portal invite created', data: result });
});

export const addNote = asyncHandler(async (req, res) => {
  const customer = await customerService.addCustomerNote(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Note added', data: customer });
});

export const updateTags = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomerTags(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Tags updated', data: customer });
});
