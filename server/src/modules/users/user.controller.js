import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as userService from './user.service.js';

export const listUsers = asyncHandler(async (req, res) => {
  const result = await userService.listUsers(req.query);
  return sendSuccess(res, {
    message: 'Users fetched',
    data: result.items,
    meta: result.meta,
  });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return sendSuccess(res, { message: 'User fetched', data: user });
});

export const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'User created', data: user });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'User updated', data: user });
});
