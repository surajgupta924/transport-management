import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as paymentService from './payment.service.js';

export const listPayments = asyncHandler(async (req, res) => {
  const result = await paymentService.listPayments(req.query, req.user);
  return sendSuccess(res, { message: 'Payments fetched', data: result.items, meta: result.meta });
});

export const getPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentById(req.params.id);
  return sendSuccess(res, { message: 'Payment fetched', data: payment });
});

export const createPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.createPayment(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Payment recorded', data: payment });
});

export const paymentSummary = asyncHandler(async (_req, res) => {
  const data = await paymentService.getPaymentSummary();
  return sendSuccess(res, { message: 'Payment summary', data });
});
