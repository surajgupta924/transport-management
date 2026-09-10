import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Customer } from '../src/modules/customers/customer.model.js';
import { Vehicle } from '../src/modules/vehicles/vehicle.model.js';
import { Driver } from '../src/modules/drivers/driver.model.js';
import { Booking, computeCharges } from '../src/modules/bookings/booking.model.js';
import { Invoice, computeInvoiceTotals } from '../src/modules/invoices/invoice.model.js';
import { LoadingStaff } from '../src/modules/loadingStaff/loadingStaff.model.js';
import { Notification } from '../src/modules/notifications/notification.model.js';
import { User } from '../src/modules/users/user.model.js';
import { Branch } from '../src/modules/branches/branch.model.js';
import { Setting } from '../src/modules/settings/setting.model.js';
import { nextBookingNumber, nextShipmentNumber, nextLrNumber, nextInvoiceNumber } from '../src/utils/sequence.js';

dotenv.config();

const uri = process.argv.find((arg) => arg.startsWith('--uri='))?.slice(6) || process.env.MONGODB_URI;
if (!uri) {
  console.error('Missing MONGODB_URI. Set it in server/.env or pass --uri="mongodb+srv://..."');
  process.exit(1);
}

async function upsert(model, filter, data) {
  return model.findOneAndUpdate(filter, { $set: data }, { upsert: true, new: true, setDefaultsOnInsert: true });
}

async function run() {
  await mongoose.connect(uri);
  console.log(`Connected: ${mongoose.connection.name}`);

  const branch = await upsert(
    Branch,
    { code: 'HO' },
    {
      name: 'Head Office',
      code: 'HO',
      phone: '+91-9999999999',
      email: 'office@tms.local',
      address: { line1: 'Transport Hub', city: 'Lucknow', state: 'Uttar Pradesh', country: 'India', postalCode: '226001' },
      status: 'ACTIVE',
      isHeadOffice: true,
    }
  );

  await Promise.all([
    upsert(Setting, { key: 'company.name' }, { value: 'DEMO', group: 'company' }),
    upsert(Setting, { key: 'company.tagline' }, { value: 'FLEET OWNERS & TRANSPORT CONTRACTORS · SAFE & ON TIME', group: 'company' }),
    upsert(Setting, { key: 'company.address' }, { value: 'H.O. 2nd Floor, 5/128 vibhuti khand, gomti nagar', group: 'company' }),
    upsert(Setting, { key: 'company.city' }, { value: 'Lucknow', group: 'company' }),
    upsert(Setting, { key: 'company.state' }, { value: 'Uttar Pradesh', group: 'company' }),
    upsert(Setting, { key: 'company.pincode' }, { value: '226010', group: 'company' }),
    upsert(Setting, { key: 'company.supportPhone' }, { value: '8767858888', group: 'company' }),
    upsert(Setting, { key: 'company.supportEmail' }, { value: 'demo@gmail.com', group: 'company' }),
    upsert(Setting, { key: 'company.gstin' }, { value: '09AAPCD1234A1Z5', group: 'company' }),
    upsert(Setting, { key: 'company.pan' }, { value: 'AAPCD1234A', group: 'company' }),
    upsert(Setting, { key: 'company.bankName' }, { value: 'HDFC Bank Ltd', group: 'company' }),
    upsert(Setting, { key: 'company.bankAccount' }, { value: '5010008888123', group: 'company' }),
    upsert(Setting, { key: 'company.ifsc' }, { value: 'HDFC0001234', group: 'company' }),
    upsert(Setting, { key: 'company.paymentTerms' }, { value: 'Due on Receipt', group: 'company' }),
  ]);

  const acme = await upsert(
    Customer,
    { email: 'ops@acmecorp.local' },
    {
      type: 'COMPANY',
      source: 'ADMIN',
      name: 'Acme Corp',
      company: 'Acme Corp',
      email: 'ops@acmecorp.local',
      mobile: '9876543210',
      gstin: '27AAPCA1234A1Z5',
      status: 'ACTIVE',
      billingAddress: { line1: 'MIDC Andheri', city: 'Mumbai', state: 'Maharashtra', postalCode: '400093' },
      branch: branch._id,
    }
  );

  const global = await upsert(
    Customer,
    { email: 'ops@globallogistics.local' },
    {
      type: 'COMPANY',
      source: 'ADMIN',
      name: 'Global Logistics',
      company: 'Global Logistics',
      email: 'ops@globallogistics.local',
      mobile: '9812345678',
      gstin: '07AAPCG1234B1Z8',
      status: 'ACTIVE',
      billingAddress: { line1: 'Okhla Phase 3', city: 'New Delhi', state: 'Delhi', postalCode: '110020' },
      branch: branch._id,
    }
  );

  const vehicle = await upsert(
    Vehicle,
    { registrationNumber: 'MH12AB3456' },
    {
      registrationNumber: 'MH12AB3456',
      type: 'TRUCK',
      manufacturer: 'Tata',
      model: '407',
      year: 2022,
      fuelType: 'DIESEL',
      currentKm: 45000,
      status: 'AVAILABLE',
      capacity: { weightKg: 7500, volumeCbm: 28 },
      branch: branch._id,
      ownership: 'OWNED',
    }
  );

  const driver = await upsert(
    Driver,
    { mobile: '9000000001' },
    {
      name: 'driver',
      mobile: '9000000001',
      licenseNumber: 'UP1420220001234',
      licenseType: 'HMV',
      status: 'AVAILABLE',
      branch: branch._id,
      advanceBalance: 0,
    }
  );

  let loader = await LoadingStaff.findOne({ employeeCode: 'EMP-TVIBATJ' });
  if (!loader) {
    loader = await LoadingStaff.create({
      name: 'hello',
      employeeCode: 'EMP-TVIBATJ',
      mobile: '9876543211',
      designation: 'LOADER',
      incentiveRate: 10,
      incentiveUnit: 'PER_KG',
      salaryType: 'MONTHLY',
      monthlySalary: 18000,
      joiningDate: new Date(),
      branchName: 'lucknow',
      branch: branch._id,
      status: 'ACTIVE',
    });
  }

  const existingOps = await Booking.findOne({ containerNumber: 'OPS-INSERT-001' });
  let pending = existingOps;
  if (!pending) {
    pending = await Booking.create({
      bookingNumber: await nextBookingNumber(),
      shipmentNumber: await nextShipmentNumber(),
      lrNumber: await nextLrNumber(),
      containerNumber: 'OPS-INSERT-001',
      customer: acme._id,
      source: 'ADMIN',
      bookingDate: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 5 * 86400000),
      pickup: { name: 'Acme Corp', address: { line1: 'MIDC Andheri', city: 'Mumbai', state: 'Maharashtra' } },
      delivery: { name: 'Global Logistics', address: { line1: 'Okhla Phase 3', city: 'New Delhi', state: 'Delhi' } },
      consignor: { name: 'Acme Corp', company: 'Acme Corp', mobile: '9876543210', city: 'Mumbai', state: 'Maharashtra', gstin: '27AAPCA1234A1Z5', address: 'MIDC Andheri' },
      consignee: { name: 'Global Logistics', company: 'Global Logistics', mobile: '9812345678', city: 'New Delhi', state: 'Delhi', gstin: '07AAPCG1234B1Z8', address: 'Okhla Phase 3' },
      cargo: { description: 'Industrial goods', weightKg: 1200, packages: 8 },
      packages: [{ type: 'Carton', quantity: 8, weightKg: 1200, description: 'Packed cartons' }],
      items: [{ name: 'Industrial goods', hsn: '9965', quantity: 8, unit: 'PKG' }],
      loadingStaff: [{ staff: loader._id, rate: 10, incentive: 120 }],
      charges: computeCharges({ freight: 24500, loading: 800, unloading: 600, taxPercent: 18 }),
      status: 'PENDING',
      paymentMode: 'TO_PAY',
      notes: 'Handle with care',
      branch: branch._id,
    });
  }

  if (!(await Invoice.findOne({ notes: 'OPS-INSERT-INVOICE' }))) {
    const lines = [
      { description: 'Freight', quantity: 1, rate: 24500, amount: 24500 },
      { description: 'Loading', quantity: 1, rate: 800, amount: 800 },
    ];
    const totals = computeInvoiceTotals({ lines, taxPercent: 18, discount: 0 });
    await Invoice.create({
      invoiceNumber: await nextInvoiceNumber(),
      customer: acme._id,
      booking: pending._id,
      lines,
      ...totals,
      amountPaid: 0,
      amountDue: totals.total,
      status: 'ISSUED',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 86400000),
      notes: 'OPS-INSERT-INVOICE',
    });
  }

  const staff = await User.find({ portalType: 'STAFF', status: 'ACTIVE' }).select('_id');
  if (!staff.length) {
    console.warn('No active STAFF users found. Login as admin first, then re-run this script to create inbox notifications.');
  } else {
    for (const user of staff) {
      const exists = await Notification.findOne({ user: user._id, title: 'Operational data ready' });
      if (exists) continue;
      await Notification.create([
        {
          user: user._id,
          title: 'Operational data ready',
          body: 'Customers, vehicles, loading staff, a pending shipment, and an outstanding invoice are now in MongoDB.',
          type: 'SUCCESS',
          link: '/app/shipments',
        },
        {
          user: user._id,
          title: `New shipment: ${pending.shipmentNumber}`,
          body: `${acme.name} is waiting for approval.`,
          type: 'INFO',
          link: '/app/shipments?status=PENDING',
        },
        {
          user: user._id,
          title: 'Outstanding invoice',
          body: 'An issued invoice is ready for collection on the Payments page.',
          type: 'WARNING',
          link: '/app/payments',
        },
      ]);
    }
  }

  console.log('Insert complete.');
  console.log(`  Customers: ${acme.name}, ${global.name}`);
  console.log(`  Vehicle: ${vehicle.registrationNumber}`);
  console.log(`  Driver: ${driver.name}`);
  console.log(`  Loading staff: ${loader.name} (${loader.employeeCode})`);
  console.log(`  Shipment: ${pending.shipmentNumber} / LR ${pending.lrNumber}`);
  console.log(`  Notifications: ${staff.length} staff inbox(es)`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
