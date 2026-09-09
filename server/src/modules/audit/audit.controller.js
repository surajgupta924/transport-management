import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { listAuditLogs } from './audit.list.service.js';

export const listLogs = asyncHandler(async (req, res) => {
  const result = await listAuditLogs(req.query);
  return sendSuccess(res, { message: 'Audit logs fetched', data: result.items, meta: result.meta });
});
