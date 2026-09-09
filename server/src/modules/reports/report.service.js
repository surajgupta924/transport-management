import { Vehicle } from '../vehicles/vehicle.model.js';
import { Driver } from '../drivers/driver.model.js';
import { Booking } from '../bookings/booking.model.js';
import { Trip } from '../trips/trip.model.js';
import { FuelRecord } from '../fuel/fuel.model.js';
import { Expense } from '../expenses/expense.model.js';
import { Invoice } from '../invoices/invoice.model.js';
import { Payment } from '../payments/payment.model.js';
import { Customer } from '../customers/customer.model.js';
import { toCsv } from '../../utils/csv.js';

function dateRange(query) {
  const match = {};
  if (query.from || query.to) {
    match.createdAt = {};
    if (query.from) match.createdAt.$gte = new Date(query.from);
    if (query.to) match.createdAt.$lte = new Date(query.to);
  }
  return match;
}

export async function fleetReport(query = {}) {
  const byStatus = await Vehicle.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const byType = await Vehicle.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]);
  const fuelSpend = await FuelRecord.aggregate([
    ...(query.from || query.to
      ? [{ $match: { date: { ...(query.from ? { $gte: new Date(query.from) } : {}), ...(query.to ? { $lte: new Date(query.to) } : {}) } } }]
      : []),
    { $group: { _id: '$vehicle', liters: { $sum: '$liters' }, amount: { $sum: '$totalAmount' }, avgKmpl: { $avg: '$kmPerLiter' } } },
    { $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'vehicle' } },
    { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        registrationNumber: '$vehicle.registrationNumber',
        liters: 1,
        amount: 1,
        avgKmpl: { $round: ['$avgKmpl', 2] },
      },
    },
    { $sort: { amount: -1 } },
    { $limit: 50 },
  ]);

  return {
    totals: {
      vehicles: await Vehicle.countDocuments(),
      available: await Vehicle.countDocuments({ status: 'AVAILABLE' }),
      onTrip: await Vehicle.countDocuments({ status: 'ON_TRIP' }),
      maintenance: await Vehicle.countDocuments({ status: 'MAINTENANCE' }),
    },
    byStatus,
    byType,
    fuelSpend,
    rows: fuelSpend,
  };
}

export async function driverReport(query = {}) {
  const byStatus = await Driver.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const tripCounts = await Trip.aggregate([
    ...(Object.keys(dateRange(query)).length ? [{ $match: dateRange(query) }] : []),
    { $match: { driver: { $ne: null } } },
    { $group: { _id: '$driver', trips: { $sum: 1 }, distance: { $sum: { $ifNull: ['$distanceKm', 0] } } } },
    { $lookup: { from: 'drivers', localField: '_id', foreignField: '_id', as: 'driver' } },
    { $unwind: { path: '$driver', preserveNullAndEmptyArrays: true } },
    { $project: { name: '$driver.name', mobile: '$driver.mobile', trips: 1, distance: 1 } },
    { $sort: { trips: -1 } },
    { $limit: 50 },
  ]);
  return {
    totals: {
      drivers: await Driver.countDocuments(),
      available: await Driver.countDocuments({ status: 'AVAILABLE' }),
      onTrip: await Driver.countDocuments({ status: 'ON_TRIP' }),
    },
    byStatus,
    tripCounts,
  };
}

export async function operationsReport(query = {}) {
  const bookingMatch = dateRange(query);
  const bookingsByStatus = await Booking.aggregate([
    ...(Object.keys(bookingMatch).length ? [{ $match: bookingMatch }] : []),
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const bookingsBySource = await Booking.aggregate([
    ...(Object.keys(bookingMatch).length ? [{ $match: bookingMatch }] : []),
    { $group: { _id: '$source', count: { $sum: 1 }, revenue: { $sum: '$charges.total' } } },
  ]);
  const tripsByStatus = await Trip.aggregate([
    ...(Object.keys(dateRange(query)).length ? [{ $match: dateRange(query) }] : []),
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  return {
    bookingsByStatus,
    bookingsBySource,
    tripsByStatus,
    rows: [
      ...bookingsByStatus.map((r) => ({ section: 'Booking status', key: r._id, count: r.count, revenue: '' })),
      ...bookingsBySource.map((r) => ({ section: 'Booking source', key: r._id, count: r.count, revenue: r.revenue })),
      ...tripsByStatus.map((r) => ({ section: 'Trip status', key: r._id, count: r.count, revenue: '' })),
    ],
  };
}

export async function financeReport(query = {}) {
  const invMatch = {};
  if (query.from || query.to) {
    invMatch.issueDate = {};
    if (query.from) invMatch.issueDate.$gte = new Date(query.from);
    if (query.to) invMatch.issueDate.$lte = new Date(query.to);
  }

  const invoices = await Invoice.aggregate([
    ...(Object.keys(invMatch).length ? [{ $match: invMatch }] : []),
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total: { $sum: '$total' },
        paid: { $sum: '$amountPaid' },
        due: { $sum: '$amountDue' },
      },
    },
  ]);

  const payments = await Payment.aggregate([
    ...(query.from || query.to
      ? [{ $match: { paidAt: { ...(query.from ? { $gte: new Date(query.from) } : {}), ...(query.to ? { $lte: new Date(query.to) } : {}) } } }]
      : []),
    { $group: { _id: '$method', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
  ]);

  const expenses = await Expense.aggregate([
    ...(query.from || query.to
      ? [{ $match: { date: { ...(query.from ? { $gte: new Date(query.from) } : {}), ...(query.to ? { $lte: new Date(query.to) } : {}) } } }]
      : []),
    { $group: { _id: { category: '$category', status: '$status' }, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);

  return {
    invoices,
    payments,
    expenses,
    rows: [
      ...invoices.map((r) => ({ section: 'Invoice', key: r._id, count: r.count, total: r.total, paid: r.paid, due: r.due })),
      ...payments.map((r) => ({ section: 'Payment', key: r._id, count: r.count, amount: r.amount })),
      ...expenses.map((r) => ({
        section: 'Expense',
        key: `${r._id?.category || ''} / ${r._id?.status || ''}`,
        count: r.count,
        amount: r.amount,
      })),
    ],
  };
}

export async function customerReport(query = {}) {
  const bySource = await Customer.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]);
  const byStatus = await Customer.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);

  const bookingMatch = dateRange(query);
  const onlineVsOffline = await Booking.aggregate([
    ...(Object.keys(bookingMatch).length ? [{ $match: bookingMatch }] : []),
    {
      $group: {
        _id: '$source',
        bookings: { $sum: 1 },
        revenue: { $sum: { $ifNull: ['$charges.total', 0] } },
      },
    },
  ]);

  const topCustomers = await Booking.aggregate([
    ...(Object.keys(bookingMatch).length ? [{ $match: bookingMatch }] : []),
    { $group: { _id: '$customer', bookings: { $sum: 1 }, revenue: { $sum: { $ifNull: ['$charges.total', 0] } } } },
    { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customer' } },
    { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: '$customer.name',
        company: '$customer.company',
        source: '$customer.source',
        bookings: 1,
        revenue: 1,
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 25 },
  ]);

  return {
    bySource,
    byStatus,
    onlineVsOffline,
    topCustomers,
    rows: topCustomers,
  };
}

export async function exportOperationsCsv(query = {}) {
  const report = await operationsReport(query);
  const rows = [
    ...report.bookingsByStatus.map((r) => ({ section: 'booking_status', key: r._id, count: r.count, revenue: '' })),
    ...report.bookingsBySource.map((r) => ({ section: 'booking_source', key: r._id, count: r.count, revenue: r.revenue })),
    ...report.tripsByStatus.map((r) => ({ section: 'trip_status', key: r._id, count: r.count, revenue: '' })),
  ];
  return toCsv(rows, [
    { header: 'Section', value: (r) => r.section },
    { header: 'Key', value: (r) => r.key },
    { header: 'Count', value: (r) => r.count },
    { header: 'Revenue', value: (r) => r.revenue },
  ]);
}
