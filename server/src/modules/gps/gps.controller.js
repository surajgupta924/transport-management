import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as service from './gps.service.js';

export const getSetup = asyncHandler(async (_req, res) => {
  const data = await service.getGpsSetup();
  return sendSuccess(res, { message: 'GPS setup fetched', data });
});

export const saveSetup = asyncHandler(async (req, res) => {
  const data = await service.saveGpsSetup(req.body, req.user, req);
  return sendSuccess(res, { message: 'GPS setup saved', data });
});

export const generateToken = asyncHandler(async (req, res) => {
  const data = await service.generateWebhookToken(req.user, req);
  return sendSuccess(res, { message: 'Webhook token generated', data });
});

export const webhook = asyncHandler(async (req, res) => {
  const data = await service.ingestWebhook(req.headers, req.body);
  return sendSuccess(res, { message: 'GPS point accepted', data });
});
