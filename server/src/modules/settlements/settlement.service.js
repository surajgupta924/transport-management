import { ExpenseSettlement } from './settlement.model.js';
import { Expense } from '../expenses/expense.model.js';
import { Driver } from '../drivers/driver.model.js';
import { Trip } from '../trips/trip.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';
import { notifyStaff } from '../notifications/notification.service.js';

function money(value) {
  return Number((Number(value) || 0).toFixed(2));
}

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

export async function tripSettlementBoard(query = {}) {
  const filter = { status: { $ne: 'CANCELLED' } };
  const trips = await Trip.find(filter)
    .populate({
      path: 'booking',
      select: 'shipmentNumber bookingNumber lrNumber pickup delivery',
    })
    .populate('driver', 'name mobile advanceBalance')
    .populate('vehicle', 'registrationNumber ownership')
    .sort({ createdAt: -1 })
    .limit(100);

  const tripIds = trips.map((trip) => trip._id);
  const [expenses, settlements] = await Promise.all([
    Expense.find({ trip: { $in: tripIds } }),
    ExpenseSettlement.find({ trip: { $in: tripIds } }),
  ]);

  const rows = trips.map((trip) => {
    const related = expenses.filter((item) => String(item.trip) === String(trip._id));
    const approved = related.filter((item) => item.status === 'APPROVED' && item.category !== 'ADVANCE');
    const advances = related.filter((item) => item.status === 'APPROVED' && item.category === 'ADVANCE');
    const expenseTotal = money(approved.reduce((sum, item) => sum + (item.amount || 0), 0));
    const advanceGiven = money(advances.reduce((sum, item) => sum + (item.amount || 0), 0));
    const settled = settlements.find((item) => String(item.trip) === String(trip._id) && item.status === 'SETTLED');
    return {
      _id: trip._id,
      trip,
      shipmentNumber: trip.booking?.shipmentNumber || trip.booking?.bookingNumber,
      route: `${trip.booking?.pickup?.address?.city || trip.booking?.pickup?.city || '—'} → ${trip.booking?.delivery?.address?.city || trip.booking?.delivery?.city || '—'}`,
      driver: trip.driver,
      vehicle: trip.vehicle,
      advanceGiven,
      expensesApproved: expenseTotal,
      expenseCount: approved.length,
      netBalance: money(expenseTotal - advanceGiven),
      status: settled ? 'SETTLED' : 'PENDING',
      settlementId: settled?._id,
    };
  });

  const visible =
    query.status === 'settled'
      ? rows.filter((row) => row.status === 'SETTLED')
      : query.status === 'pending'
        ? rows.filter((row) => row.status === 'PENDING')
        : rows;

  return {
    items: visible,
    stats: {
      totalTrips: rows.length,
      totalAdvances: money(rows.reduce((sum, row) => sum + row.advanceGiven, 0)),
      approvedExpenses: money(rows.reduce((sum, row) => sum + row.expensesApproved, 0)),
      pendingSettlement: rows.filter((row) => row.status === 'PENDING').length,
      unsettledAmount: money(rows.filter((row) => row.status === 'PENDING').reduce((sum, row) => sum + Math.abs(row.netBalance), 0)),
    },
  };
}

export async function recordAdvance(payload, actor, req) {
  let trip = null;
  let driverId = payload.driverId;
  if (payload.tripId) {
    trip = await Trip.findById(payload.tripId);
    if (!trip) throw new ApiError(400, 'Invalid trip');
    driverId = driverId || trip.driver;
  }
  const driver = await Driver.findById(driverId);
  if (!driver) throw new ApiError(400, 'Invalid driver');

  const expense = await Expense.create({
    category: 'ADVANCE',
    title: 'Driver Advance',
    amount: payload.amount,
    date: payload.date || new Date(),
    driver: driver._id,
    trip: trip?._id,
    vehicle: trip?.vehicle,
    status: 'APPROVED',
    approvedBy: actor._id,
    approvedAt: new Date(),
    notes: payload.notes || '',
    createdBy: actor._id,
  });

  driver.advanceBalance = money((driver.advanceBalance || 0) + Number(payload.amount));
  await driver.save();

  await writeAuditLog({
    actor,
    module: 'expenses',
    entity: 'Expense',
    entityId: expense._id,
    action: 'ADVANCE',
    description: `${actor.email} recorded driver advance of ${payload.amount}`,
    req,
  });
  notifyStaff({
    title: 'Driver advance recorded',
    body: `₹${payload.amount} given to ${driver.name}.`,
    type: 'INFO',
    link: '/app/trip-settlement',
  }).catch(() => {});
  return expense;
}

export async function settleTrip(tripId, actor, req) {
  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, 'Trip not found');
  if (!trip.driver) throw new ApiError(400, 'Trip has no driver');
  const existing = await ExpenseSettlement.findOne({ trip: tripId, status: 'SETTLED' });
  if (existing) throw new ApiError(400, 'Trip already settled');

  const expenses = await Expense.find({ trip: tripId, status: 'APPROVED', category: { $ne: 'ADVANCE' } });
  const advances = await Expense.find({ trip: tripId, status: 'APPROVED', category: 'ADVANCE' });
  const expenseTotal = money(expenses.reduce((sum, item) => sum + (item.amount || 0), 0));
  const advanceGiven = money(advances.reduce((sum, item) => sum + (item.amount || 0), 0));
  const advanceRecovered = money(Math.min(advanceGiven, expenseTotal));
  const netPayable = money(expenseTotal - advanceGiven);

  const settlement = await ExpenseSettlement.create({
    driver: trip.driver,
    trip: trip._id,
    expenses: expenses.map((item) => item._id),
    expenseTotal,
    advanceGiven,
    advanceRecovered,
    netPayable,
    status: 'SETTLED',
    settledAt: new Date(),
    createdBy: actor._id,
    notes: 'Trip settlement',
  });

  const driver = await Driver.findById(trip.driver);
  if (driver && advanceRecovered > 0) {
    driver.advanceBalance = Math.max(0, money((driver.advanceBalance || 0) - advanceRecovered));
    await driver.save();
  }

  await writeAuditLog({
    actor,
    module: 'expenses',
    entity: 'ExpenseSettlement',
    entityId: settlement._id,
    action: 'SETTLED',
    description: `${actor.email} settled trip ${trip.tripNumber}`,
    req,
  });
  notifyStaff({
    title: 'Trip settled',
    body: `${trip.tripNumber} settlement is complete. Net ${netPayable >= 0 ? 'payable' : 'recoverable'} ₹${Math.abs(netPayable)}.`,
    type: 'SUCCESS',
    link: '/app/trip-settlement',
  }).catch(() => {});
  return getSettlementById(settlement._id);
}
