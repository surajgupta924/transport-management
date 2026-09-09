import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as settlementService from './settlement.service.js';

export const listSettlements = asyncHandler(async (req, res) => {
  const result = await settlementService.listSettlements(req.query);
  return sendSuccess(res, { message: 'Settlements fetched', data: result.items, meta: result.meta });
});

export const getSettlement = asyncHandler(async (req, res) => {
  const settlement = await settlementService.getSettlementById(req.params.id);
  return sendSuccess(res, { message: 'Settlement fetched', data: settlement });
});

export const getDriverBalance = asyncHandler(async (req, res) => {
  const balance = await settlementService.getDriverBalance(req.params.driverId);
  return sendSuccess(res, { message: 'Driver balance fetched', data: balance });
});

export const createSettlement = asyncHandler(async (req, res) => {
  const settlement = await settlementService.createSettlement(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Settlement created', data: settlement });
});

export const settleSettlement = asyncHandler(async (req, res) => {
  const settlement = await settlementService.settleSettlement(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Settlement updated', data: settlement });
});
