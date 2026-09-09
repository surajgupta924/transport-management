import { Expense } from './expense.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';

function mapPayload(payload) {
  const data = { ...payload };
  const map = [
    ['vehicleId', 'vehicle'],
    ['driverId', 'driver'],
    ['tripId', 'trip'],
    ['branchId', 'branch'],
    ['vendorId', 'vendor'],
  ];
  for (const [from, to] of map) {
    if (payload[from] !== undefined) {
      data[to] = payload[from] || undefined;
      delete data[from];
    }
  }
  return data;
}

export async function listExpenses(query, actor) {
  const { page, limit, skip, sort, search } = parsePagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.vehicleId) filter.vehicle = query.vehicleId;
  if (query.driverId) filter.driver = query.driverId;
  if (query.tripId) filter.trip = query.tripId;
  if (query.branchId) filter.branch = query.branchId;
  if (query.vendorId) filter.vendor = query.vendorId;
  if (actor?.portalType === 'DRIVER') {
    const driverId = actor.linkedDriver?._id || actor.linkedDriver;
    if (driverId) filter.driver = driverId;
    else filter.createdBy = actor._id;
  }
  if (search) {
    filter.$or = [
      { title: new RegExp(search, 'i') },
      { notes: new RegExp(search, 'i') },
    ];
  }
  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = new Date(query.from);
    if (query.to) filter.date.$lte = new Date(query.to);
  }

  const [items, total] = await Promise.all([
    Expense.find(filter)
      .populate('vehicle', 'registrationNumber')
      .populate('driver', 'name mobile')
      .populate('trip', 'tripNumber')
      .populate('branch', 'name code')
      .populate('vendor', 'name')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Expense.countDocuments(filter),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getExpenseById(id) {
  const expense = await Expense.findById(id)
    .populate('vehicle', 'registrationNumber')
    .populate('driver', 'name mobile')
    .populate('trip', 'tripNumber')
    .populate('branch', 'name code')
    .populate('vendor', 'name')
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email');
  if (!expense) throw new ApiError(404, 'Expense not found');
  return expense;
}

export async function createExpense(payload, actor, req) {
  const data = mapPayload(payload);
  if (!data.title && payload.description) data.title = payload.description;
  if (payload.description && !data.notes) data.notes = payload.description;
  data.createdBy = actor._id;
  data.status = 'PENDING';
  if (actor.portalType === 'DRIVER' && !data.driver) {
    data.driver = actor.linkedDriver?._id || actor.linkedDriver || undefined;
  }
  const expense = await Expense.create(data);
  await writeAuditLog({
    actor,
    module: 'expenses',
    entity: 'Expense',
    entityId: expense._id,
    action: 'CREATE',
    description: `${actor.email} created expense ${expense.title}`,
    req,
  });
  return getExpenseById(expense._id);
}

export async function updateExpense(id, payload, actor, req) {
  const expense = await Expense.findById(id);
  if (!expense) throw new ApiError(404, 'Expense not found');
  if (expense.status !== 'PENDING') {
    throw new ApiError(400, 'Only PENDING expenses can be edited');
  }
  Object.assign(expense, mapPayload(payload));
  await expense.save();
  await writeAuditLog({
    actor,
    module: 'expenses',
    entity: 'Expense',
    entityId: expense._id,
    action: 'UPDATE',
    description: `${actor.email} updated expense ${expense.title}`,
    req,
  });
  return getExpenseById(expense._id);
}

export async function approveExpense(id, { status = 'APPROVED', reason } = {}, actor, req) {
  const expense = await Expense.findById(id);
  if (!expense) throw new ApiError(404, 'Expense not found');
  if (expense.status !== 'PENDING') {
    throw new ApiError(400, 'Expense already processed');
  }
  expense.status = status;
  expense.approvedBy = actor._id;
  expense.approvedAt = new Date();
  if (status === 'REJECTED') expense.rejectionReason = reason || '';
  await expense.save();

  await writeAuditLog({
    actor,
    module: 'expenses',
    entity: 'Expense',
    entityId: expense._id,
    action: status,
    description: `${actor.email} ${status.toLowerCase()} expense ${expense.title}`,
    req,
  });
  return getExpenseById(expense._id);
}

export async function deleteExpense(id, actor, req) {
  const expense = await Expense.findById(id);
  if (!expense) throw new ApiError(404, 'Expense not found');
  if (expense.status === 'APPROVED') throw new ApiError(400, 'Cannot delete approved expense');
  await expense.deleteOne();
  await writeAuditLog({
    actor,
    module: 'expenses',
    entity: 'Expense',
    entityId: id,
    action: 'DELETE',
    description: `${actor.email} deleted expense`,
    req,
  });
  return { deleted: true };
}
