import { Branch } from './branch.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';

export async function listBranches(query) {
  const { page, limit, skip, sort, search } = parsePagination(query);
  const filter = {};
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { code: new RegExp(search, 'i') },
    ];
  }
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    Branch.find(filter).sort(sort).skip(skip).limit(limit),
    Branch.countDocuments(filter),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getBranchById(id) {
  const branch = await Branch.findById(id);
  if (!branch) throw new ApiError(404, 'Branch not found');
  return branch;
}

export async function createBranch(payload, actor, req) {
  const existing = await Branch.findOne({ code: payload.code.toUpperCase() });
  if (existing) throw new ApiError(409, 'Branch code already exists');

  if (payload.isHeadOffice) {
    await Branch.updateMany({}, { $set: { isHeadOffice: false } });
  }

  const branch = await Branch.create({
    ...payload,
    code: payload.code.toUpperCase(),
    email: payload.email || undefined,
  });

  await writeAuditLog({
    actor,
    module: 'branches',
    entity: 'Branch',
    entityId: branch._id,
    action: 'CREATE',
    description: `${actor.email} created branch ${branch.name}`,
    req,
  });
  return branch;
}

export async function updateBranch(id, payload, actor, req) {
  const branch = await Branch.findById(id);
  if (!branch) throw new ApiError(404, 'Branch not found');

  if (payload.code && payload.code.toUpperCase() !== branch.code) {
    const existing = await Branch.findOne({ code: payload.code.toUpperCase() });
    if (existing) throw new ApiError(409, 'Branch code already exists');
    branch.code = payload.code.toUpperCase();
  }
  if (payload.isHeadOffice) {
    await Branch.updateMany({ _id: { $ne: branch._id } }, { $set: { isHeadOffice: false } });
  }

  const fields = ['name', 'phone', 'email', 'address', 'status', 'isHeadOffice'];
  for (const f of fields) {
    if (payload[f] !== undefined) branch[f] = payload[f] || (f === 'email' ? undefined : payload[f]);
  }
  await branch.save();

  await writeAuditLog({
    actor,
    module: 'branches',
    entity: 'Branch',
    entityId: branch._id,
    action: 'UPDATE',
    description: `${actor.email} updated branch ${branch.name}`,
    req,
  });
  return branch;
}

export async function deleteBranch(id, actor, req) {
  const branch = await Branch.findById(id);
  if (!branch) throw new ApiError(404, 'Branch not found');
  await branch.deleteOne();
  await writeAuditLog({
    actor,
    module: 'branches',
    entity: 'Branch',
    entityId: id,
    action: 'DELETE',
    description: `${actor.email} deleted branch ${branch.name}`,
    req,
  });
  return { deleted: true };
}
