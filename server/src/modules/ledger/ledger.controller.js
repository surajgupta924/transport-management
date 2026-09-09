import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { sendCsv } from '../../utils/csv.js';
import * as ledgerService from './ledger.service.js';

export const listCustomerLedger = asyncHandler(async (req, res) => {
  const result = await ledgerService.listCustomerLedger(req.query);
  return sendSuccess(res, { message: 'Customer ledger fetched', data: result.items, meta: result.meta });
});

export const getCustomerSummary = asyncHandler(async (req, res) => {
  const data = await ledgerService.getCustomerLedgerSummary(req.params.customerId);
  return sendSuccess(res, { message: 'Customer ledger summary', data });
});

export const createAdjustment = asyncHandler(async (req, res) => {
  const entry = await ledgerService.createAdjustment(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Ledger entry created', data: entry });
});

export const listVendorLedger = asyncHandler(async (req, res) => {
  const result = await ledgerService.listVendorLedger(req.query);
  return sendSuccess(res, { message: 'Vendor ledger fetched', data: result.items, meta: result.meta });
});

export const exportCsv = asyncHandler(async (req, res) => {
  const csv = await ledgerService.exportCustomerLedgerCsv(req.query);
  return sendCsv(res, 'customer-ledger.csv', csv);
});
