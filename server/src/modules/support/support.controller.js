import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as supportService from './support.service.js';

export const listTickets = asyncHandler(async (req, res) => {
  const result = await supportService.listTickets(req.query, req.user);
  return sendSuccess(res, { message: 'Tickets fetched', data: result.items, meta: result.meta });
});

export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await supportService.getTicketById(req.params.id);
  return sendSuccess(res, { message: 'Ticket fetched', data: ticket });
});

export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await supportService.createTicket(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Ticket created', data: ticket });
});

export const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await supportService.updateTicket(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Ticket updated', data: ticket });
});

export const addMessage = asyncHandler(async (req, res) => {
  const ticket = await supportService.addMessage(req.params.id, req.body, req.user);
  return sendSuccess(res, { message: 'Message added', data: ticket });
});
