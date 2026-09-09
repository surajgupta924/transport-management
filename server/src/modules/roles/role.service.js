import { Role } from './role.model.js';
import { Permission } from './permission.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';

export async function listPermissions() {
  return Permission.find().sort({ module: 1, action: 1 }).lean();
}

export async function listRoles(query) {
  const { page, limit, skip, sort, search } = parsePagination(query);
  const filter = {};
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { slug: new RegExp(search, 'i') },
    ];
  }
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    Role.find(filter)
      .populate('permissions', 'code module action description')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Role.countDocuments(filter),
  ]);

  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getRoleById(id) {
  const role = await Role.findById(id).populate('permissions', 'code module action description');
  if (!role) throw new ApiError(404, 'Role not found');
  return role;
}

export async function createRole(payload, actor, req) {
  const existing = await Role.findOne({ slug: payload.slug });
  if (existing) throw new ApiError(409, 'Role slug already exists');

  const permissions = await Permission.find({ _id: { $in: payload.permissionIds } });
  if (permissions.length !== payload.permissionIds.length) {
    throw new ApiError(400, 'One or more permissions are invalid');
  }

  const role = await Role.create({
    name: payload.name,
    slug: payload.slug,
    description: payload.description || '',
    permissions: permissions.map((p) => p._id),
    status: payload.status || 'ACTIVE',
    isSystem: false,
  });

  await role.populate('permissions', 'code module action description');

  await writeAuditLog({
    actor,
    module: 'roles',
    entity: 'Role',
    entityId: role._id,
    action: 'CREATE',
    description: `${actor.email} created role ${role.name}`,
    newValue: { name: role.name, slug: role.slug },
    req,
  });

  return role;
}

export async function updateRole(id, payload, actor, req) {
  const role = await Role.findById(id);
  if (!role) throw new ApiError(404, 'Role not found');
  if (role.isSystem && payload.slug && payload.slug !== role.slug) {
    throw new ApiError(400, 'Cannot change slug of a system role');
  }

  const oldValue = { name: role.name, slug: role.slug, status: role.status };

  if (payload.permissionIds) {
    const permissions = await Permission.find({ _id: { $in: payload.permissionIds } });
    if (permissions.length !== payload.permissionIds.length) {
      throw new ApiError(400, 'One or more permissions are invalid');
    }
    role.permissions = permissions.map((p) => p._id);
  }

  if (payload.name !== undefined) role.name = payload.name;
  if (payload.slug !== undefined && !role.isSystem) role.slug = payload.slug;
  if (payload.description !== undefined) role.description = payload.description;
  if (payload.status !== undefined) role.status = payload.status;

  await role.save();
  await role.populate('permissions', 'code module action description');

  await writeAuditLog({
    actor,
    module: 'roles',
    entity: 'Role',
    entityId: role._id,
    action: 'UPDATE',
    description: `${actor.email} updated role ${role.name}`,
    oldValue,
    newValue: { name: role.name, slug: role.slug, status: role.status },
    req,
  });

  return role;
}

export async function deleteRole(id, actor, req) {
  const role = await Role.findById(id);
  if (!role) throw new ApiError(404, 'Role not found');
  if (role.isSystem) throw new ApiError(400, 'Cannot delete a system role');

  await role.deleteOne();

  await writeAuditLog({
    actor,
    module: 'roles',
    entity: 'Role',
    entityId: role._id,
    action: 'DELETE',
    description: `${actor.email} deleted role ${role.name}`,
    oldValue: { name: role.name, slug: role.slug },
    req,
  });

  return true;
}
