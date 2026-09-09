import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as authService from './auth.service.js';
import * as otpService from './otp.service.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerCustomer(req.body, req);
  return sendSuccess(res, {
    status: 201,
    message: 'Registration successful',
    data: result,
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, req);
  return sendSuccess(res, {
    message: 'Login successful',
    data: result,
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body.refreshToken, req);
  return sendSuccess(res, {
    message: 'Token refreshed',
    data: result,
  });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id, req.body?.refreshToken, req);
  return sendSuccess(res, { message: 'Logged out successfully' });
});

export const me = asyncHandler(async (req, res) => {
  const result = await authService.getMe(req.user._id);
  return sendSuccess(res, { message: 'Profile fetched', data: result });
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user._id, req.body, req);
  return sendSuccess(res, { message: result.message });
});

export const sendOtp = asyncHandler(async (req, res) => {
  const result = await otpService.sendOtp(req.body);
  return sendSuccess(res, { message: result.message, data: result });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const result = await otpService.verifyOtp(req.body);
  return sendSuccess(res, { message: 'Email verified', data: result });
});
