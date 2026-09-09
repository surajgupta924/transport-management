import { Booking, BOOKING_TRANSITIONS, computeCharges } from './booking.model.js';
import { Customer } from '../customers/customer.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';
import { nextBookingNumber } from '../../utils/sequence.js';
import { assertOtpToken } from '../auth/otp.service.js';
import { enqueueEmail } from '../../jobs/index.js';

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
  delete data.otpToken;
  delete data.clientName;
  delete data.clientEmail;
  delete data.clientPhone;
  return data;
}

export async function listBookings(query, actor) {
  const { page, limit, skip, sort, search } = parsePagination(query);
  const filter = {};

  if (search) {
    filter.$or = [
      { bookingNumber: new RegExp(search, 'i') },
      { notes: new RegExp(search, 'i') },
      { 'pickup.address.city': new RegExp(search, 'i') },
      { 'delivery.address.city': new RegExp(search, 'i') },
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
    .populate('trip')
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
  data.createdBy = actor._id;

  // Online and offline share the same workflow
  if (!data.source) data.source = 'ADMIN';

  const booking = await Booking.create(data);
  await writeAuditLog({
    actor,
    module: 'bookings',
    entity: 'Booking',
    entityId: booking._id,
    action: 'CREATE',
    description: `${actor.email} created booking ${booking.bookingNumber}`,
    newValue: { status: booking.status, source: booking.source },
    req,
  });

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
  if (!['DRAFT', 'CANCELLED'].includes(booking.status)) {
    throw new ApiError(400, 'Only DRAFT or CANCELLED bookings can be deleted');
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
