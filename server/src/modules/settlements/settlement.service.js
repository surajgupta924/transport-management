import { ExpenseSettlement } from './settlement.model.js';
import { Expense } from '../expenses/expense.model.js';
import { Driver } from '../drivers/driver.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';

export async function listSettlements(query) {
  const { page, limit, skip, sort } = parsePagination(query);
  const filter = {};
  if (query.driverId) filter.driver = query.driverId;
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    ExpenseSettlement.find(filter)
      .populate('driver', 'name mobile advanceBalance')
      .populate('expenses', 'title amount category status')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    ExpenseSettlement.countDocuments(filter),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getSettlementById(id) {
  const settlement = await ExpenseSettlement.findById(id)
    .populate('driver', 'name mobile advanceBalance')
    .populate('expenses', 'title amount category status date')
    .populate('createdBy', 'name email');
  if (!settlement) throw new ApiError(404, 'Settlement not found');
  return settlement;
}

export async function getDriverBalance(driverId) {
  const driver = await Driver.findById(driverId).select('name mobile advanceBalance status');
  if (!driver) throw new ApiError(404, 'Driver not found');

  const approved = await Expense.aggregate([
    { $match: { driver: driver._id, status: 'APPROVED' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  return {
    driver,
    advanceBalance: driver.advanceBalance || 0,
    approvedExpenseTotal: approved[0]?.total || 0,
  };
}

export async function createSettlement(payload, actor, req) {
  const driver = await Driver.findById(payload.driverId);
  if (!driver) throw new ApiError(400, 'Invalid driver');

  let expenseTotal = 0;
  let expenses = [];
  if (payload.expenseIds?.length) {
    expenses = await Expense.find({
      _id: { $in: payload.expenseIds },
      driver: driver._id,
      status: 'APPROVED',
    });
    if (expenses.length !== payload.expenseIds.length) {
      throw new ApiError(400, 'Some expenses are invalid or not approved');
    }
    expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  }

  const advanceGiven = payload.advanceGiven || 0;
  const advanceRecovered = payload.advanceRecovered || 0;
  const netPayable = Number((expenseTotal + advanceGiven - advanceRecovered).toFixed(2));

  const settlement = await ExpenseSettlement.create({
    driver: driver._id,
    periodFrom: payload.periodFrom,
    periodTo: payload.periodTo,
    expenses: expenses.map((e) => e._id),
    expenseTotal,
    advanceGiven,
    advanceRecovered,
    netPayable,
    notes: payload.notes || '',
    createdBy: actor._id,
  });

  if (advanceGiven > 0) {
    driver.advanceBalance = (driver.advanceBalance || 0) + advanceGiven;
    await driver.save();
  }

  await writeAuditLog({
    actor,
    module: 'expenses',
    entity: 'ExpenseSettlement',
    entityId: settlement._id,
    action: 'CREATE',
    description: `${actor.email} created settlement for ${driver.name}`,
    req,
  });
  return getSettlementById(settlement._id);
}

export async function settleSettlement(id, { status }, actor, req) {
  const settlement = await ExpenseSettlement.findById(id);
  if (!settlement) throw new ApiError(404, 'Settlement not found');
  if (settlement.status !== 'DRAFT') throw new ApiError(400, 'Settlement already processed');

  settlement.status = status;
  if (status === 'SETTLED') {
    settlement.settledAt = new Date();
    const driver = await Driver.findById(settlement.driver);
    if (driver && settlement.advanceRecovered > 0) {
      driver.advanceBalance = Math.max(0, (driver.advanceBalance || 0) - settlement.advanceRecovered);
      await driver.save();
    }
  }
  await settlement.save();

  await writeAuditLog({
    actor,
    module: 'expenses',
    entity: 'ExpenseSettlement',
    entityId: settlement._id,
    action: status,
    description: `${actor.email} marked settlement ${status}`,
    req,
  });
  return getSettlementById(settlement._id);
}
