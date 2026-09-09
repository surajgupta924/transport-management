import { Route } from './route.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';

export async function listRoutes(query) {
  const { page, limit, skip, sort, search } = parsePagination(query);
  const filter = {};
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { origin: new RegExp(search, 'i') },
      { destination: new RegExp(search, 'i') },
      { code: new RegExp(search, 'i') },
    ];
  }
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    Route.find(filter).sort(sort).skip(skip).limit(limit),
    Route.countDocuments(filter),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getRouteById(id) {
  const route = await Route.findById(id);
  if (!route) throw new ApiError(404, 'Route not found');
  return route;
}

export async function createRoute(payload, actor, req) {
  const route = await Route.create(payload);
  await writeAuditLog({
    actor,
    module: 'trips',
    entity: 'Route',
    entityId: route._id,
    action: 'CREATE',
    description: `${actor.email} created route ${route.name}`,
    req,
  });
  return route;
}

export async function updateRoute(id, payload, actor, req) {
  const route = await Route.findById(id);
  if (!route) throw new ApiError(404, 'Route not found');
  Object.assign(route, payload);
  await route.save();
  await writeAuditLog({
    actor,
    module: 'trips',
    entity: 'Route',
    entityId: route._id,
    action: 'UPDATE',
    description: `${actor.email} updated route ${route.name}`,
    req,
  });
  return route;
}

export async function deleteRoute(id, actor, req) {
  const route = await Route.findById(id);
  if (!route) throw new ApiError(404, 'Route not found');
  await route.deleteOne();
  await writeAuditLog({
    actor,
    module: 'trips',
    entity: 'Route',
    entityId: id,
    action: 'DELETE',
    description: `${actor.email} deleted route ${route.name}`,
    req,
  });
  return { deleted: true };
}
