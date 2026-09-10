import { LoadingStaff } from './loadingStaff.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';
import { nextEmployeeCode } from '../../utils/sequence.js';

function mapPayload(payload) {
  const data = { ...payload };
  if (payload.branchId !== undefined) {
    data.branch = payload.branchId || undefined;
    delete data.branchId;
  }
  return data;
}

export async function listLoadingStaff(query) {
  const { page, limit, skip, sort, search } = parsePagination(query);
  const filter = {};
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { employeeCode: new RegExp(search, 'i') },
      { mobile: new RegExp(search, 'i') },
      { branchName: new RegExp(search, 'i') },
    ];
  }
  if (query.status) filter.status = query.status;
  if (query.designation) filter.designation = query.designation;
  if (query.branchId) filter.branch = query.branchId;

  const [items, total] = await Promise.all([
    LoadingStaff.find(filter).populate('branch', 'name code').sort(sort).skip(skip).limit(limit),
    LoadingStaff.countDocuments(filter),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getLoadingStaffById(id) {
  const staff = await LoadingStaff.findById(id).populate('branch', 'name code');
  if (!staff) throw new ApiError(404, 'Loading staff not found');
  return staff;
}

export async function createLoadingStaff(payload, actor, req) {
  const data = mapPayload(payload);
  data.employeeCode = data.employeeCode || (await nextEmployeeCode());
  const staff = await LoadingStaff.create(data);
  await writeAuditLog({
    actor,
    module: 'loadingStaff',
    entity: 'LoadingStaff',
    entityId: staff._id,
    action: 'CREATE',
    description: `${actor.email} added loading staff ${staff.name}`,
    req,
  });
  return getLoadingStaffById(staff._id);
}

export async function updateLoadingStaff(id, payload, actor, req) {
  const staff = await LoadingStaff.findById(id);
  if (!staff) throw new ApiError(404, 'Loading staff not found');
  Object.assign(staff, mapPayload(payload));
  await staff.save();
  await writeAuditLog({
    actor,
    module: 'loadingStaff',
    entity: 'LoadingStaff',
    entityId: staff._id,
    action: 'UPDATE',
    description: `${actor.email} updated loading staff ${staff.name}`,
    req,
  });
  return getLoadingStaffById(staff._id);
}

export async function applyLoadingIncentives(assignments = [], weightKg = 0) {
  const quintals = Number(weightKg) / 100;
  const result = [];
  for (const item of assignments) {
    const staffId = item.staff || item.staffId;
    if (!staffId) continue;
    const staff = await LoadingStaff.findById(staffId);
    if (!staff || staff.status !== 'ACTIVE') continue;
    const rate = Number(item.rate ?? staff.incentiveRate) || 0;
    const incentive = Number((quintals * rate).toFixed(2));
    staff.earnedIncentive = Number((staff.earnedIncentive + incentive).toFixed(2));
    staff.loadsCount += 1;
    if (staff.designation === 'SUPERVISOR') staff.supervisedCount += 1;
    await staff.save();
    result.push({ staff: staff._id, rate, incentive });
  }
  return result;
}
