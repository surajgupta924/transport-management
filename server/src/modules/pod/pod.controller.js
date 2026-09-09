import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as podService from './pod.service.js';

export const listPods = asyncHandler(async (req, res) => {
  const result = await podService.listPods(req.query, req.user);
  return sendSuccess(res, { message: 'POD records fetched', data: result.items, meta: result.meta });
});

export const getPod = asyncHandler(async (req, res) => {
  const pod = await podService.getPodById(req.params.id);
  return sendSuccess(res, { message: 'POD fetched', data: pod });
});

export const createPod = asyncHandler(async (req, res) => {
  const pod = await podService.createPod(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'POD created', data: pod });
});

export const updatePod = asyncHandler(async (req, res) => {
  const pod = await podService.updatePod(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'POD updated', data: pod });
});

export const verifyPod = asyncHandler(async (req, res) => {
  const pod = await podService.verifyPod(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'POD verification updated', data: pod });
});
