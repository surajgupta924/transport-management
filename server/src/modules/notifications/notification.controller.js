import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as notificationService from './notification.service.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.listNotifications(req.user._id, req.query);
  return sendSuccess(res, { message: 'Notifications fetched', data: result.items, meta: result.meta });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.user._id, req.params.id);
  return sendSuccess(res, { message: 'Notification marked read', data: notification });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead(req.user._id);
  return sendSuccess(res, { message: 'All notifications marked read', data: result });
});
