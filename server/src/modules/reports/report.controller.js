import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { sendCsv } from '../../utils/csv.js';
import * as reportService from './report.service.js';

export const fleet = asyncHandler(async (req, res) => {
  const data = await reportService.fleetReport(req.query);
  return sendSuccess(res, { message: 'Fleet report', data });
});

export const driver = asyncHandler(async (req, res) => {
  const data = await reportService.driverReport(req.query);
  return sendSuccess(res, { message: 'Driver report', data });
});

export const operations = asyncHandler(async (req, res) => {
  const data = await reportService.operationsReport(req.query);
  return sendSuccess(res, { message: 'Operations report', data });
});

export const finance = asyncHandler(async (req, res) => {
  const data = await reportService.financeReport(req.query);
  return sendSuccess(res, { message: 'Finance report', data });
});

export const customer = asyncHandler(async (req, res) => {
  const data = await reportService.customerReport(req.query);
  return sendSuccess(res, { message: 'Customer report', data });
});

export const exportOperations = asyncHandler(async (req, res) => {
  const csv = await reportService.exportOperationsCsv(req.query);
  return sendCsv(res, 'operations-report.csv', csv);
});
