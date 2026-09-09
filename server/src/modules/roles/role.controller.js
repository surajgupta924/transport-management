import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as roleService from './role.service.js';

export const listPermissions = asyncHandler(async (req, res) => {
  const items = await roleService.listPermissions();
  return sendSuccess(res, { message: 'Permissions fetched', data: items });
});

export const listRoles = asyncHandler(async (req, res) => {
  const result = await roleService.listRoles(req.query);
  return sendSuccess(res, {
    message: 'Roles fetched',
    data: result.items,
    meta: result.meta,
  });
});

export const getRole = asyncHandler(async (req, res) => {
  const role = await roleService.getRoleById(req.params.id);
  return sendSuccess(res, { message: 'Role fetched', data: role });
});

export const createRole = asyncHandler(async (req, res) => {
  const role = await roleService.createRole(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Role created', data: role });
});

export const updateRole = asyncHandler(async (req, res) => {
  const role = await roleService.updateRole(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Role updated', data: role });
});

export const deleteRole = asyncHandler(async (req, res) => {
  await roleService.deleteRole(req.params.id, req.user, req);
  return sendSuccess(res, { message: 'Role deleted' });
});
