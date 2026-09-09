import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as branchService from './branch.service.js';

export const listBranches = asyncHandler(async (req, res) => {
  const result = await branchService.listBranches(req.query);
  return sendSuccess(res, { message: 'Branches fetched', data: result.items, meta: result.meta });
});

export const getBranch = asyncHandler(async (req, res) => {
  const branch = await branchService.getBranchById(req.params.id);
  return sendSuccess(res, { message: 'Branch fetched', data: branch });
});

export const createBranch = asyncHandler(async (req, res) => {
  const branch = await branchService.createBranch(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Branch created', data: branch });
});

export const updateBranch = asyncHandler(async (req, res) => {
  const branch = await branchService.updateBranch(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Branch updated', data: branch });
});

export const deleteBranch = asyncHandler(async (req, res) => {
  const result = await branchService.deleteBranch(req.params.id, req.user, req);
  return sendSuccess(res, { message: 'Branch deleted', data: result });
});
