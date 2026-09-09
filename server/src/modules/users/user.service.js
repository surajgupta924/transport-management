import { User } from './user.model.js';
import { Role } from '../roles/role.model.js';
import { Branch } from '../branches/branch.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';

function sanitize(user) {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.passwordHash;
  delete obj.refreshTokens;
  return obj;
}

export async function listUsers(query) {
  const { page, limit, skip, sort, search } = parsePagination(query);
  const filter = {};

  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { mobile: new RegExp(search, 'i') },
    ];
  }
  if (query.status) filter.status = query.status;
  if (query.portalType) filter.portalType = query.portalType;
  if (query.roleId) filter.role = query.roleId;
  if (query.branchId) filter.branch = query.branchId;

  const [items, total] = await Promise.all([
    User.find(filter)
      .populate('role', 'name slug')
      .populate('branch', 'name code')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return { items: items.map(sanitize), meta: buildMeta({ page, limit, total }) };
}

export async function getUserById(id) {
  const user = await User.findById(id).populate('role', 'name slug').populate('branch', 'name code');
  if (!user) throw new ApiError(404, 'User not found');
  return sanitize(user);
}

export async function createUser(payload, actor, req) {
  const existing = await User.findOne({ email: payload.email });
  if (existing) throw new ApiError(409, 'Email already exists');

  const role = await Role.findById(payload.roleId);
  if (!role) throw new ApiError(400, 'Invalid role');

  let branch;
  if (payload.branchId) {
    branch = await Branch.findById(payload.branchId);
    if (!branch) throw new ApiError(400, 'Invalid branch');
  }

  const passwordHash = await User.hashPassword(payload.password);
  const user = await User.create({
    name: payload.name,
    email: payload.email,
    mobile: payload.mobile || undefined,
    passwordHash,
    role: role._id,
    branch: branch?._id,
    portalType: payload.portalType || 'STAFF',
    status: payload.status || 'ACTIVE',
    emailVerified: true,
  });

  await user.populate('role', 'name slug');
  await user.populate('branch', 'name code');

  await writeAuditLog({
    actor,
    module: 'users',
    entity: 'User',
    entityId: user._id,
    action: 'CREATE',
    description: `${actor.email} created user ${user.email}`,
    newValue: { email: user.email, role: role.slug },
    req,
  });

  return sanitize(user);
}

export async function updateUser(id, payload, actor, req) {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');

  const oldValue = {
    name: user.name,
    status: user.status,
    role: user.role?.toString(),
  };

  if (payload.roleId) {
    const role = await Role.findById(payload.roleId);
    if (!role) throw new ApiError(400, 'Invalid role');
    user.role = role._id;
  }

  if (payload.branchId !== undefined) {
    if (!payload.branchId) {
      user.branch = undefined;
    } else {
      const branch = await Branch.findById(payload.branchId);
      if (!branch) throw new ApiError(400, 'Invalid branch');
      user.branch = branch._id;
    }
  }

  if (payload.name !== undefined) user.name = payload.name;
  if (payload.mobile !== undefined) user.mobile = payload.mobile || undefined;
  if (payload.portalType !== undefined) user.portalType = payload.portalType;
  if (payload.status !== undefined) user.status = payload.status;

  await user.save();
  await user.populate('role', 'name slug');
  await user.populate('branch', 'name code');

  await writeAuditLog({
    actor,
    module: 'users',
    entity: 'User',
    entityId: user._id,
    action: 'UPDATE',
    description: `${actor.email} updated user ${user.email}`,
    oldValue,
    newValue: { name: user.name, status: user.status, role: user.role?.slug },
    req,
  });

  return sanitize(user);
}
