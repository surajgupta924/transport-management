import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as dashboardService from './dashboard.service.js';

export const getStats = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboardStats();
  return sendSuccess(res, { message: 'Dashboard stats', data });
});
