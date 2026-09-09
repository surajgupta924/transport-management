import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as routeService from './route.service.js';

export const listRoutes = asyncHandler(async (req, res) => {
  const result = await routeService.listRoutes(req.query);
  return sendSuccess(res, { message: 'Routes fetched', data: result.items, meta: result.meta });
});

export const getRoute = asyncHandler(async (req, res) => {
  const route = await routeService.getRouteById(req.params.id);
  return sendSuccess(res, { message: 'Route fetched', data: route });
});

export const createRoute = asyncHandler(async (req, res) => {
  const route = await routeService.createRoute(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Route created', data: route });
});

export const updateRoute = asyncHandler(async (req, res) => {
  const route = await routeService.updateRoute(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Route updated', data: route });
});

export const deleteRoute = asyncHandler(async (req, res) => {
  const result = await routeService.deleteRoute(req.params.id, req.user, req);
  return sendSuccess(res, { message: 'Route deleted', data: result });
});
