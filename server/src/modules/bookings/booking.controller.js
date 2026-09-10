import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as bookingService from './booking.service.js';

export const listBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.listBookings(req.query, req.user);
  return sendSuccess(res, { message: 'Bookings fetched', data: result.items, meta: result.meta });
});

export const bookingStats = asyncHandler(async (req, res) => {
  const data = await bookingService.getBookingStats(req.user);
  return sendSuccess(res, { message: 'Shipment stats', data });
});

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id);
  return sendSuccess(res, { message: 'Booking fetched', data: booking });
});

export const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Booking created', data: booking });
});

export const updateBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.updateBooking(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Booking updated', data: booking });
});

export const transitionBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.transitionBooking(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Booking status updated', data: booking });
});

export const deleteBooking = asyncHandler(async (req, res) => {
  const result = await bookingService.deleteBooking(req.params.id, req.user, req);
  return sendSuccess(res, { message: 'Booking deleted', data: result });
});
