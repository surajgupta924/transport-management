import { Customer } from '../modules/customers/customer.model.js';
import { Vehicle } from '../modules/vehicles/vehicle.model.js';
import { Driver } from '../modules/drivers/driver.model.js';
import { Booking, computeCharges } from '../modules/bookings/booking.model.js';
import { Trip } from '../modules/trips/trip.model.js';
import { Invoice, computeInvoiceTotals } from '../modules/invoices/invoice.model.js';
import { Expense } from '../modules/expenses/expense.model.js';
import { User } from '../modules/users/user.model.js';
import { Role } from '../modules/roles/role.model.js';
import { Branch } from '../modules/branches/branch.model.js';
import { nextBookingNumber, nextTripNumber, nextInvoiceNumber } from '../utils/sequence.js';

export async function seedDemoIfEmpty() {
  const existingCustomers = await Customer.countDocuments();
  if (existingCustomers > 0) {
    console.log('Demo data skipped (customers already exist).');
    return;
  }

  const branch = await Branch.findOne({ code: 'HO' });
  const customerRole = await Role.findOne({ slug: 'customer' });
  const driverRole = await Role.findOne({ slug: 'driver' });

  const offline = await Customer.create({
    type: 'COMPANY',
    source: 'OFFLINE',
    name: 'Apex Traders',
    company: 'Apex Traders Pvt Ltd',
    email: 'ops@apextraders.local',
    mobile: '9811111111',
    gstin: '27AAPCA1234A1Z5',
    status: 'ACTIVE',
    paymentTerms: 'NET_15',
    creditLimit: 500000,
    tags: ['VIP', 'corporate'],
    billingAddress: { line1: 'Andheri East', city: 'Mumbai', state: 'Maharashtra', postalCode: '400069' },
    branch: branch?._id,
  });

  const online = await Customer.create({
    type: 'INDIVIDUAL',
    source: 'ONLINE',
    name: 'Northstar Retail',
    company: 'Northstar Retail',
    email: 'customer@tms.local',
    mobile: '9822222222',
    status: 'ACTIVE',
    tags: ['online'],
    billingAddress: { line1: 'SG Highway', city: 'Ahmedabad', state: 'Gujarat', postalCode: '380015' },
    branch: branch?._id,
  });

  if (customerRole && !(await User.findOne({ email: 'customer@tms.local' }))) {
    const portalUser = await User.create({
      name: 'Northstar Portal',
      email: 'customer@tms.local',
      mobile: '9822222222',
      passwordHash: await User.hashPassword('Customer@12345'),
      role: customerRole._id,
      portalType: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: true,
      linkedCustomer: online._id,
    });
    online.portalUser = portalUser._id;
    await online.save();
  }

  const v1 = await Vehicle.create({
    registrationNumber: 'MH12AB1234',
    type: 'TRUCK',
    manufacturer: 'Tata',
    model: '407',
    year: 2021,
    fuelType: 'DIESEL',
    currentKm: 84210,
    status: 'ON_TRIP',
    capacity: { weightKg: 7500, volumeCbm: 28 },
    branch: branch?._id,
  });

  await Vehicle.create({
    registrationNumber: 'GJ01CD7788',
    type: 'CONTAINER',
    manufacturer: 'Ashok Leyland',
    model: '1920',
    year: 2022,
    fuelType: 'DIESEL',
    currentKm: 61002,
    status: 'AVAILABLE',
    capacity: { weightKg: 16000, volumeCbm: 40 },
    branch: branch?._id,
  });

  const d1 = await Driver.create({
    name: 'Suresh Yadav',
    mobile: '9876500001',
    email: 'driver@tms.local',
    licenseNumber: 'MH1420110012345',
    licenseType: 'HMV',
    licenseExpiry: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000),
    status: 'ON_TRIP',
    employeeId: 'DRV-001',
    salary: { basic: 22000, allowance: 3000 },
    branch: branch?._id,
  });

  await Driver.create({
    name: 'Imran Khan',
    mobile: '9876500002',
    licenseNumber: 'GJ0520190098765',
    licenseType: 'HMV',
    licenseExpiry: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000),
    status: 'AVAILABLE',
    employeeId: 'DRV-002',
    salary: { basic: 24000, allowance: 2500 },
    branch: branch?._id,
  });

  if (driverRole && !(await User.findOne({ email: 'driver@tms.local' }))) {
    const driverUser = await User.create({
      name: 'Suresh Yadav',
      email: 'driver@tms.local',
      mobile: '9876500001',
      passwordHash: await User.hashPassword('Driver@12345'),
      role: driverRole._id,
      portalType: 'DRIVER',
      status: 'ACTIVE',
      emailVerified: true,
      linkedDriver: d1._id,
    });
    d1.user = driverUser._id;
    await d1.save();
  }

  const b1 = await Booking.create({
    bookingNumber: await nextBookingNumber(),
    customer: offline._id,
    source: 'OFFLINE',
    pickup: {
      contactName: 'Warehouse',
      contactPhone: '9811111111',
      scheduledAt: new Date(),
      address: { line1: 'Bhiwandi Hub', city: 'Mumbai', state: 'Maharashtra', postalCode: '421302' },
    },
    delivery: {
      contactName: 'Receiving',
      contactPhone: '9898989898',
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      address: { line1: 'Okhla ICD', city: 'Delhi', state: 'Delhi', postalCode: '110020' },
    },
    cargo: { description: 'FMCG cartons', weightKg: 4200, packages: 80 },
    charges: computeCharges({ freight: 28000, loading: 1500, unloading: 1500, taxPercent: 18 }),
    paymentMode: 'CREDIT',
    status: 'IN_TRANSIT',
    branch: branch?._id,
  });

  const b2 = await Booking.create({
    bookingNumber: await nextBookingNumber(),
    customer: online._id,
    source: 'ONLINE',
    pickup: {
      contactName: 'Northstar DC',
      contactPhone: '9822222222',
      address: { line1: 'Naroda GIDC', city: 'Ahmedabad', state: 'Gujarat', postalCode: '382330' },
    },
    delivery: {
      contactName: 'Store',
      address: { line1: 'Sitapura', city: 'Jaipur', state: 'Rajasthan', postalCode: '302022' },
    },
    cargo: { description: 'Textile rolls', weightKg: 2100, packages: 24 },
    charges: computeCharges({ freight: 14500, other: 800, taxPercent: 18 }),
    paymentMode: 'PREPAID',
    status: 'CONFIRMED',
    branch: branch?._id,
  });

  const trip = await Trip.create({
    tripNumber: await nextTripNumber(),
    booking: b1._id,
    vehicle: v1._id,
    driver: d1._id,
    status: 'IN_TRANSIT',
    startKm: v1.currentKm,
    startTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
    lastLocation: { lat: 19.2183, lng: 73.0781, updatedAt: new Date() },
  });
  b1.trip = trip._id;
  await b1.save();

  const lines = [
    { description: 'Freight', quantity: 1, rate: 28000, amount: 28000 },
    { description: 'Loading', quantity: 1, rate: 1500, amount: 1500 },
  ];
  const totals = computeInvoiceTotals({ lines, taxPercent: 18, discount: 0 });
  await Invoice.create({
    invoiceNumber: await nextInvoiceNumber(),
    customer: offline._id,
    booking: b1._id,
    trip: trip._id,
    lines,
    taxPercent: 18,
    discount: 0,
    ...totals,
    amountPaid: 0,
    amountDue: totals.total,
    status: 'ISSUED',
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  });

  await Expense.create({
    category: 'TOLL',
    title: 'Mumbai-Delhi highway toll',
    amount: 2450,
    vehicle: v1._id,
    driver: d1._id,
    trip: trip._id,
    status: 'PENDING',
    notes: 'NH-48',
  });

  console.log('Demo data seeded.');
  console.log('Customer portal: customer@tms.local / Customer@12345');
  console.log('Driver portal: driver@tms.local / Driver@12345');
}
