import { Booking, BOOKING_TRANSITIONS, computeCharges } from './booking.model.js';
import { Customer } from '../customers/customer.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';
import { nextBookingNumber, nextShipmentNumber, nextLrNumber } from '../../utils/sequence.js';
import { assertOtpToken } from '../auth/otp.service.js';
import { enqueueEmail } from '../../jobs/index.js';
import { applyLoadingIncentives } from '../loadingStaff/loadingStaff.service.js';
import { notifyStaff } from '../notifications/notification.service.js';
import PDFDocument from 'pdfkit';
import { Setting } from '../settings/setting.model.js';

function linkedId(value) {
  if (!value) return undefined;
  return value._id || value;
}

function normalizeLocation(loc) {
  if (!loc) return loc;
  const addressIn = typeof loc.address === 'string' ? { line1: loc.address } : loc.address || {};
  const city = loc.city || addressIn.city;
  const postalCode = loc.pincode || addressIn.postalCode || addressIn.pincode;
  const line1 = addressIn.line1 || (typeof loc.address === 'string' ? loc.address : loc.line1);
  return {
    name: loc.name,
    contactName: loc.contactName || loc.contact,
    contactPhone: loc.contactPhone || loc.phone || loc.contact,
    landmark: loc.landmark,
    scheduledAt: loc.scheduledAt || loc.date || undefined,
    address: {
      line1,
      line2: addressIn.line2,
      city,
      state: loc.state || addressIn.state,
      country: addressIn.country || 'India',
      postalCode,
      lat: loc.lat ?? addressIn.lat,
      lng: loc.lng ?? addressIn.lng,
    },
  };
}

export function presentLocation(loc) {
  if (!loc) return loc;
  const obj = loc.toObject ? loc.toObject() : { ...loc };
  const addr = obj.address && typeof obj.address === 'object' ? obj.address : {};
  const line1 = typeof obj.address === 'string' ? obj.address : addr.line1;
  return {
    ...obj,
    city: obj.city || addr.city,
    state: obj.state || addr.state,
    address: line1 || '',
    pincode: obj.pincode || addr.postalCode,
    contact: obj.contact || obj.contactName || obj.contactPhone,
    contactName: obj.contactName,
    contactPhone: obj.contactPhone,
    landmark: obj.landmark,
    date: obj.date || obj.scheduledAt,
    lat: obj.lat ?? addr.lat,
    lng: obj.lng ?? addr.lng,
  };
}

export function presentBooking(booking) {
  if (!booking) return booking;
  const obj = booking.toObject ? booking.toObject() : { ...booking };
  obj.pickup = presentLocation(obj.pickup);
  obj.delivery = presentLocation(obj.delivery);
  obj.pickupCity = obj.pickup?.city;
  obj.destinationCity = obj.delivery?.city;
  obj.pickupAddress = obj.pickup?.address;
  obj.deliveryAddress = obj.delivery?.address;
  obj.remarks = obj.notes;
  obj.shipmentNumber = obj.shipmentNumber || obj.bookingNumber;
  obj.origin = obj.pickup?.city;
  obj.destination = obj.delivery?.city;
  return obj;
}

function mapPayload(payload) {
  const data = { ...payload };
  if (payload.customerId) {
    data.customer = payload.customerId;
    delete data.customerId;
  }
  if (payload.routeId !== undefined) {
    data.route = payload.routeId || undefined;
    delete data.routeId;
  }
  if (payload.branchId !== undefined) {
    data.branch = payload.branchId || undefined;
    delete data.branchId;
  }
  if (payload.pickup) data.pickup = normalizeLocation(payload.pickup);
  if (payload.delivery) data.delivery = normalizeLocation(payload.delivery);
  if (payload.remarks && !payload.notes) data.notes = payload.remarks;
  delete data.remarks;
  if (payload.charges) data.charges = computeCharges(payload.charges);
  if (payload.loadingStaff) {
    data.loadingStaff = payload.loadingStaff
      .map((row) => ({
        staff: row.staff || row.staffId,
        rate: row.rate || 0,
        incentive: row.incentive || 0,
      }))
      .filter((row) => row.staff);
  }
  if (payload.fromCity || payload.origin) {
    data.pickup = data.pickup || {};
    data.pickup.address = { ...(data.pickup.address || {}), city: payload.fromCity || payload.origin, line1: payload.fromAddress || data.pickup.address?.line1 };
  }
  if (payload.toCity || payload.destination) {
    data.delivery = data.delivery || {};
    data.delivery.address = { ...(data.delivery.address || {}), city: payload.toCity || payload.destination, line1: payload.toAddress || data.delivery.address?.line1 };
  }
  delete data.otpToken;
  delete data.clientName;
  delete data.clientEmail;
  delete data.clientPhone;
  delete data.fromCity;
  delete data.toCity;
  delete data.origin;
  delete data.destination;
  delete data.fromAddress;
  delete data.toAddress;
  return data;
}

export async function listBookings(query, actor) {
  const { page, limit, skip, sort, search } = parsePagination(query);
  const filter = {};

  if (search) {
    filter.$or = [
      { bookingNumber: new RegExp(search, 'i') },
      { shipmentNumber: new RegExp(search, 'i') },
      { lrNumber: new RegExp(search, 'i') },
      { containerNumber: new RegExp(search, 'i') },
      { notes: new RegExp(search, 'i') },
      { 'pickup.address.city': new RegExp(search, 'i') },
      { 'delivery.address.city': new RegExp(search, 'i') },
      { 'consignor.name': new RegExp(search, 'i') },
      { 'consignee.name': new RegExp(search, 'i') },
    ];
  }
  if (query.status) filter.status = query.status;
  if (query.source) filter.source = query.source;
  if (query.customerId) filter.customer = query.customerId;
  if (query.branchId) filter.branch = query.branchId;
  if (actor?.portalType === 'CUSTOMER' || query.mine === 'true' || query.mine === true) {
    const customerId = linkedId(actor?.linkedCustomer);
    if (customerId) filter.customer = customerId;
    else if (actor?.portalType === 'CUSTOMER') filter._id = { $exists: false };
  }
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate('customer', 'name company email mobile source')
      .populate('route', 'name origin destination')
      .populate('branch', 'name code')
      .populate('trip', 'tripNumber status')
      .populate('loadingStaff.staff', 'name employeeCode designation incentiveRate')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  return { items: items.map(presentBooking), meta: buildMeta({ page, limit, total }) };
}

export async function getBookingById(id) {
  const booking = await Booking.findById(id)
    .populate('customer', 'name company email mobile source')
    .populate('route', 'name origin destination stops distanceKm')
    .populate('branch', 'name code')
    .populate({
      path: 'trip',
      populate: [
        { path: 'vehicle', select: 'registrationNumber type' },
        { path: 'driver', select: 'name mobile' },
      ],
    })
    .populate('loadingStaff.staff', 'name employeeCode designation incentiveRate')
    .populate('createdBy', 'name email');
  if (!booking) throw new ApiError(404, 'Booking not found');
  return presentBooking(booking);
}

export async function createBooking(payload, actor, req) {
  if (actor?.portalType === 'CUSTOMER') {
    assertOtpToken(payload.otpToken, payload.clientEmail || actor.email);
  }

  let customerId =
    actor?.portalType === 'CUSTOMER' ? linkedId(actor.linkedCustomer) : payload.customerId;

  if (!customerId && payload.clientEmail) {
    const email = String(payload.clientEmail).toLowerCase().trim();
    let customer = await Customer.findOne({ email });
    if (!customer) {
      customer = await Customer.create({
        type: 'INDIVIDUAL',
        source: actor?.portalType === 'DRIVER' ? 'OFFLINE' : payload.source || 'ADMIN',
        name: payload.clientName || email,
        email,
        mobile: payload.clientPhone || '',
        status: 'ACTIVE',
      });
    }
    customerId = customer._id;
  }

  const customer = await Customer.findById(customerId);
  if (!customer) throw new ApiError(400, 'Invalid customer');
  payload = { ...payload, customerId: customer._id };
  if (actor?.portalType === 'CUSTOMER') payload.source = payload.source || 'ONLINE';
  if (actor?.portalType === 'DRIVER') payload.source = payload.source || 'OFFLINE';

  const data = mapPayload(payload);
  data.bookingNumber = await nextBookingNumber();
  data.shipmentNumber = payload.shipmentNumber || (await nextShipmentNumber());
  data.lrNumber = payload.lrNumber || (await nextLrNumber());
  data.createdBy = actor._id;
  data.bookingDate = data.bookingDate || new Date();
  if (!data.source) data.source = 'ADMIN';
  if (!data.status) data.status = 'PENDING';

  if (data.loadingStaff?.length) {
    data.loadingStaff = await applyLoadingIncentives(data.loadingStaff, data.cargo?.weightKg || 0);
  }

  const booking = await Booking.create(data);
  await writeAuditLog({
    actor,
    module: 'bookings',
    entity: 'Booking',
    entityId: booking._id,
    action: 'CREATE',
    description: `${actor.email} created shipment ${booking.shipmentNumber || booking.bookingNumber}`,
    newValue: { status: booking.status, source: booking.source },
    req,
  });

  notifyStaff({
    title: `New shipment: ${booking.shipmentNumber || booking.bookingNumber}`,
    body: `${customer.name} · ${booking.pickup?.address?.city || ''} → ${booking.delivery?.address?.city || ''} is waiting for approval.`,
    type: 'INFO',
    link: '/app/shipments?status=PENDING',
  }).catch(() => {});

  if (customer.email) {
    enqueueEmail('booking-confirmation', {
      to: customer.email,
      bookingNumber: booking.bookingNumber,
      customerName: customer.name,
    }).catch((err) => console.warn('[booking] confirmation email failed:', err.message));
  }

  return getBookingById(booking._id);
}

export async function updateBooking(id, payload, actor, req) {
  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
    throw new ApiError(400, `Cannot edit booking in ${booking.status} status`);
  }

  if (payload.customerId) {
    const customer = await Customer.findById(payload.customerId);
    if (!customer) throw new ApiError(400, 'Invalid customer');
  }

  const data = mapPayload(payload);
  Object.assign(booking, data);
  await booking.save();

  await writeAuditLog({
    actor,
    module: 'bookings',
    entity: 'Booking',
    entityId: booking._id,
    action: 'UPDATE',
    description: `${actor.email} updated booking ${booking.bookingNumber}`,
    req,
  });
  return getBookingById(booking._id);
}

export async function transitionBooking(id, { status, reason }, actor, req) {
  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, 'Booking not found');

  const allowed = BOOKING_TRANSITIONS[booking.status] || [];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `Cannot transition from ${booking.status} to ${status}`);
  }

  const oldStatus = booking.status;
  booking.status = status;
  if (status === 'CANCELLED') booking.cancelledReason = reason || '';
  await booking.save();

  await writeAuditLog({
    actor,
    module: 'bookings',
    entity: 'Booking',
    entityId: booking._id,
    action: 'STATUS_CHANGE',
    description: `${actor.email} changed booking ${booking.bookingNumber} ${oldStatus} → ${status}`,
    oldValue: { status: oldStatus },
    newValue: { status },
    req,
  });
  return getBookingById(booking._id);
}

export async function deleteBooking(id, actor, req) {
  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (!['DRAFT', 'CANCELLED', 'PENDING', 'UNASSIGNED', 'CONFIRMED'].includes(booking.status)) {
    throw new ApiError(400, 'Assigned or in-transit shipments cannot be deleted');
  }
  await booking.deleteOne();
  await writeAuditLog({
    actor,
    module: 'bookings',
    entity: 'Booking',
    entityId: id,
    action: 'DELETE',
    description: `${actor.email} deleted booking ${booking.bookingNumber}`,
    req,
  });
  return { deleted: true };
}

export async function getBookingStats(actor) {
  const base = {};
  if (actor?.portalType === 'CUSTOMER') {
    const customerId = linkedId(actor?.linkedCustomer);
    if (customerId) base.customer = customerId;
    else base._id = { $exists: false };
  }
  const rows = await Booking.aggregate([{ $match: base }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
  const byStatus = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  return {
    total,
    pending: byStatus.PENDING || 0,
    unassigned: (byStatus.UNASSIGNED || 0) + (byStatus.CONFIRMED || 0),
    assigned: byStatus.ASSIGNED || 0,
    inTransit: byStatus.IN_TRANSIT || 0,
    outForDelivery: byStatus.OUT_FOR_DELIVERY || 0,
    delivered: byStatus.DELIVERED || 0,
    completed: byStatus.COMPLETED || 0,
    podUploaded: byStatus.POD_UPLOADED || 0,
    cancelled: byStatus.CANCELLED || 0,
    byStatus,
  };
}

function companyLine(map, key, fallback = '') {
  const value = map[key];
  return value == null || value === '' ? fallback : String(value);
}

export async function generateLrPdf(id) {
  const booking = await Booking.findById(id)
    .populate('customer', 'name company email mobile gstin')
    .populate('branch', 'name code')
    .populate('loadingStaff.staff', 'name employeeCode designation');
  if (!booking) throw new ApiError(404, 'Shipment not found');

  const settings = await Setting.find({ key: { $regex: /^company\./ } });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const presented = presentBooking(booking);
  const charges = presented.charges || {};

  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const done = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  const companyName = companyLine(map, 'company.name', 'SwiftHaul');
  doc.fontSize(16).text(companyName, { align: 'left' });
  doc.fontSize(9).text(companyLine(map, 'company.tagline', 'FLEET OWNERS & TRANSPORT CONTRACTORS'), { align: 'left' });
  doc.text(
    [
      companyLine(map, 'company.address'),
      [companyLine(map, 'company.city'), companyLine(map, 'company.state'), companyLine(map, 'company.pincode')].filter(Boolean).join(', '),
      companyLine(map, 'company.supportPhone') ? `Phone: ${companyLine(map, 'company.supportPhone')}` : '',
      companyLine(map, 'company.supportEmail') ? `Email: ${companyLine(map, 'company.supportEmail')}` : '',
      companyLine(map, 'company.gstin') ? `GSTIN: ${companyLine(map, 'company.gstin')}` : '',
    ]
      .filter(Boolean)
      .join('  |  ')
  );
  doc.moveDown(0.4);
  doc.fontSize(14).text('LORRY RECEIPT', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(10);
  doc.text(`LR Number: ${presented.lrNumber || '—'}`);
  doc.text(`Shipment: ${presented.shipmentNumber || presented.bookingNumber}`);
  doc.text(`LR Date: ${presented.bookingDate ? new Date(presented.bookingDate).toLocaleDateString('en-IN') : '—'}`);
  doc.text(`Payment Mode: ${presented.paymentMode || '—'}`);
  doc.moveDown(0.4);
  doc.text(`Consignor: ${presented.consignor?.name || presented.customer?.name || '—'}`);
  doc.text(`${presented.consignor?.company || ''} ${presented.consignor?.mobile || ''}`.trim());
  doc.text(`${presented.consignor?.address || presented.pickup?.address || ''} ${presented.consignor?.city || presented.pickup?.city || ''}`.trim());
  doc.text(`GSTIN: ${presented.consignor?.gstin || presented.customer?.gstin || '—'}`);
  doc.moveDown(0.3);
  doc.text(`Consignee: ${presented.consignee?.name || '—'}`);
  doc.text(`${presented.consignee?.company || ''} ${presented.consignee?.mobile || ''}`.trim());
  doc.text(`${presented.consignee?.address || presented.delivery?.address || ''} ${presented.consignee?.city || presented.delivery?.city || ''}`.trim());
  doc.text(`GSTIN: ${presented.consignee?.gstin || '—'}`);
  doc.moveDown(0.4);
  doc.text(`From: ${presented.pickup?.city || '—'}    To: ${presented.delivery?.city || '—'}`);
  doc.text(`Expected delivery: ${presented.expectedDeliveryDate ? new Date(presented.expectedDeliveryDate).toLocaleDateString('en-IN') : '—'}`);
  doc.moveDown(0.3);
  doc.text('Goods:');
  const items = presented.items?.length ? presented.items : [{ name: presented.cargo?.description || 'Goods', quantity: presented.cargo?.packages || 1, unit: 'PKG' }];
  items.forEach((item, index) => {
    doc.text(`${index + 1}. ${item.name || 'Item'}  Qty: ${item.quantity || 1} ${item.unit || ''}  HSN: ${item.hsn || '—'}`);
  });
  (presented.packages || []).forEach((pkg, index) => {
    doc.text(`Pkg ${index + 1}: ${pkg.type || 'Package'} x ${pkg.quantity || 1}  ${pkg.weightKg || 0} kg  ${pkg.description || ''}`);
  });
  doc.moveDown(0.3);
  doc.text(`Weight: ${presented.cargo?.weightKg || 0} kg`);
  doc.text(`Freight: ${charges.freight || 0}   Loading: ${charges.loading || 0}   Unloading: ${charges.unloading || 0}`);
  doc.text(`Taxable: ${charges.taxableAmount || 0}   GST ${charges.taxPercent || 0}%: ${charges.taxAmount || 0}`);
  doc.fontSize(12).text(`Net payable: ${charges.total || 0}`);
  if (presented.notes) {
    doc.moveDown(0.3).fontSize(10).text(`Remarks: ${presented.notes}`);
  }
  doc.end();
  return done;
}
