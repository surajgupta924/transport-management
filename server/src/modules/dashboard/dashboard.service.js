import { Customer } from '../customers/customer.model.js';
import { Vehicle } from '../vehicles/vehicle.model.js';
import { Driver } from '../drivers/driver.model.js';
import { Booking } from '../bookings/booking.model.js';
import { Trip } from '../trips/trip.model.js';
import { Invoice } from '../invoices/invoice.model.js';
import { Expense } from '../expenses/expense.model.js';
import { SupportTicket } from '../support/support.model.js';
import { presentBooking } from '../bookings/booking.service.js';
import { VehicleDocument } from '../vehicles/vehicle.model.js';
import { DriverDocument } from '../drivers/driver.model.js';

function countBy(rows, key) {
  const map = Object.fromEntries((rows || []).map((r) => [r._id || 'UNKNOWN', r.count]));
  return map[key] || 0;
}

export async function getDashboardStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const [
    customers,
    vehiclesTotal,
    driversTotal,
    bookingsToday,
    pendingBookings,
    activeTrips,
    pendingExpenses,
    openInvoices,
    openTickets,
    vehicleByStatus,
    driverByStatus,
    bookingsBySource,
    tripsByStatus,
    revenueAgg,
    todayRevenueAgg,
    monthRevenueAgg,
    monthExpenseAgg,
    expiringVehicleDocs,
    expiringDriverDocs,
    overdueInvoices,
  ] = await Promise.all([
    Customer.countDocuments({ status: 'ACTIVE' }),
    Vehicle.countDocuments({ status: { $ne: 'SOLD' } }),
    Driver.countDocuments({ status: { $ne: 'INACTIVE' } }),
    Booking.countDocuments({ createdAt: { $gte: startOfDay } }),
    Booking.countDocuments({ status: { $in: ['DRAFT', 'CONFIRMED'] } }),
    Trip.countDocuments({ status: { $in: ['ASSIGNED', 'STARTED', 'IN_PROGRESS', 'IN_TRANSIT'] } }),
    Expense.countDocuments({ status: 'PENDING' }),
    Invoice.countDocuments({ status: { $in: ['ISSUED', 'PARTIAL', 'OVERDUE'] } }),
    SupportTicket.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS'] } }),
    Vehicle.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Driver.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]),
    Trip.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Invoice.aggregate([
      { $match: { status: { $in: ['ISSUED', 'PARTIAL', 'PAID', 'OVERDUE'] } } },
      {
        $group: {
          _id: null,
          billed: { $sum: '$total' },
          collected: { $sum: '$amountPaid' },
          outstanding: { $sum: '$amountDue' },
        },
      },
    ]),
    Invoice.aggregate([
      { $match: { issueDate: { $gte: startOfDay }, status: { $in: ['ISSUED', 'PARTIAL', 'PAID', 'OVERDUE'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Invoice.aggregate([
      { $match: { issueDate: { $gte: startOfMonth }, status: { $in: ['ISSUED', 'PARTIAL', 'PAID', 'OVERDUE'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: startOfMonth }, status: { $ne: 'REJECTED' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    VehicleDocument.countDocuments({ expiryDate: { $lte: in30Days, $gte: startOfDay } }).catch(() => 0),
    DriverDocument.countDocuments({ expiryDate: { $lte: in30Days, $gte: startOfDay } }).catch(() => 0),
    Invoice.countDocuments({ status: 'OVERDUE' }),
  ]);

  const recentBookings = await Booking.find()
    .sort({ createdAt: -1 })
    .limit(8)
    .populate('customer', 'name company source')
    .select('bookingNumber status source charges createdAt pickup delivery');

  const recentTrips = await Trip.find()
    .sort({ updatedAt: -1 })
    .limit(8)
    .populate('vehicle', 'registrationNumber')
    .populate('driver', 'name')
    .select('tripNumber status startTime endTime lastLocation');

  const monthlyRevenue = monthRevenueAgg[0]?.total || 0;
  const monthlyExpenses = monthExpenseAgg[0]?.total || 0;

  return {
    counts: {
      customers,
      vehicles: vehiclesTotal,
      vehiclesAvailable: countBy(vehicleByStatus, 'AVAILABLE'),
      vehiclesOnTrip: countBy(vehicleByStatus, 'ON_TRIP'),
      vehiclesMaintenance: countBy(vehicleByStatus, 'MAINTENANCE'),
      drivers: driversTotal,
      driversAvailable: countBy(driverByStatus, 'AVAILABLE'),
      bookingsToday,
      pendingBookings,
      activeTrips,
      pendingExpenses,
      openInvoices,
      openTickets,
      todayRevenue: todayRevenueAgg[0]?.total || 0,
      monthlyRevenue,
      monthlyExpenses,
      profit: monthlyRevenue - monthlyExpenses,
    },
    charts: {
      bookingsBySource,
      tripsByStatus,
    },
    finance: revenueAgg[0] || { billed: 0, collected: 0, outstanding: 0 },
    alerts: {
      expiringDocuments: (expiringVehicleDocs || 0) + (expiringDriverDocs || 0),
      overdueInvoices,
      pendingExpenses,
      pendingBookings,
    },
    recentBookings: recentBookings.map(presentBooking),
    recentTrips,
  };
}
