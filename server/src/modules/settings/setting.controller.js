import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as settingService from './setting.service.js';

export const listPublicSettings = asyncHandler(async (_req, res) => {
  const data = await settingService.listPublicSettings();
  return sendSuccess(res, { message: 'Public settings fetched', data });
});

export const listSettings = asyncHandler(async (req, res) => {
  const items = await settingService.listSettings(req.query);
  return sendSuccess(res, { message: 'Settings fetched', data: items });
});

export const getSetting = asyncHandler(async (req, res) => {
  const setting = await settingService.getSetting(req.params.key);
  return sendSuccess(res, { message: 'Setting fetched', data: setting });
});

export const upsertSetting = asyncHandler(async (req, res) => {
  const setting = await settingService.upsertSetting(req.body, req.user, req);
  return sendSuccess(res, { message: 'Setting saved', data: setting });
});

export const bulkUpsert = asyncHandler(async (req, res) => {
  const settings = await settingService.bulkUpsert(req.body.settings, req.user, req);
  return sendSuccess(res, { message: 'Settings saved', data: settings });
});
