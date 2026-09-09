import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as expenseService from './expense.service.js';

export const listExpenses = asyncHandler(async (req, res) => {
  const result = await expenseService.listExpenses(req.query, req.user);
  return sendSuccess(res, { message: 'Expenses fetched', data: result.items, meta: result.meta });
});

export const getExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.getExpenseById(req.params.id);
  return sendSuccess(res, { message: 'Expense fetched', data: expense });
});

export const createExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.createExpense(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Expense created', data: expense });
});

export const updateExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.updateExpense(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Expense updated', data: expense });
});

export const approveExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.approveExpense(
    req.params.id,
    { status: req.body?.status || 'APPROVED', reason: req.body?.reason },
    req.user,
    req
  );
  return sendSuccess(res, { message: 'Expense approval updated', data: expense });
});

export const rejectExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.approveExpense(
    req.params.id,
    { status: 'REJECTED', reason: req.body?.reason },
    req.user,
    req
  );
  return sendSuccess(res, { message: 'Expense rejected', data: expense });
});

export const deleteExpense = asyncHandler(async (req, res) => {
  const result = await expenseService.deleteExpense(req.params.id, req.user, req);
  return sendSuccess(res, { message: 'Expense deleted', data: result });
});
