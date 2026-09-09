import { Trip, TRIP_TRANSITIONS, ACTIVE_TRIP_STATUSES, normalizeTripStatus } from './trip.model.js';
import { Booking } from '../bookings/booking.model.js';
import { Vehicle } from '../vehicles/vehicle.model.js';
import { Driver } from '../drivers/driver.model.js';
import * as vehicleService from '../vehicles/vehicle.service.js';
import * as driverService from '../drivers/driver.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';
import { nextTripNumber } from '../../utils/sequence.js';
import { presentBooking } from '../bookings/booking.service.js';

function linkedId(value) {
  if (!value) return undefined;
  return value._id || value;
}

async function assertAssignable(vehicleId, driverId, { excludeTripId, allowVehicleId, allowDriverId } = {}) {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) throw new ApiError(400, 'Invalid vehicle');
  const vehicleOk =
    vehicle.status === 'AVAILABLE' ||
    (allowVehicleId && String(vehicle._id) === String(allowVehicleId) && vehicle.status === 'ON_TRIP');
  if (!vehicleOk) {
    throw new ApiError(400, `Vehicle is ${vehicle.status} and cannot be assigned`);
  }

  const driver = await Driver.findById(driverId);
  if (!driver) throw new ApiError(400, 'Invalid driver');
  const driverOk =
    driver.status === 'AVAILABLE' ||
    (allowDriverId && String(driver._id) === String(allowDriverId) && driver.status === 'ON_TRIP');
  if (!driverOk) {
    throw new ApiError(400, `Driver is ${driver.status} and cannot be assigned`);
  }

  if (await vehicleService.hasExpiredDocuments(vehicleId)) {
    throw new ApiError(400, 'Vehicle has expired documents');
  }
  if (await driverService.hasExpiredDocuments(driverId)) {
    throw new ApiError(400, 'Driver has expired documents');
  }

  const activeFilter = {
    status: { $in: ACTIVE_TRIP_STATUSES },
    $or: [{ vehicle: vehicleId }, { driver: driverId }],
  };
  if (excludeTripId) activeFilter._id = { $ne: excludeTripId };
  const conflict = await Trip.findOne(activeFilter);
  if (conflict) {
    throw new ApiError(409, 'Vehicle or driver already assigned to an active trip');
  }

  return { vehicle, driver };
}

export async function listTrips(query, actor) {
  const { page, limit, skip, sort, search } = parsePagination(query);
  const filter = {};
  if (search) filter.tripNumber = new RegExp(search, 'i');
  if (query.status) {
    if (query.status === 'IN_TRANSIT' || query.status === 'IN_PROGRESS') {
      filter.status = { $in: ['IN_TRANSIT', 'IN_PROGRESS'] };
    } else {
      filter.status = query.status;
    }
  }
  if (query.driverId) filter.driver = query.driverId;
  if (query.vehicleId) filter.vehicle = query.vehicleId;
  if (query.bookingId) filter.booking = query.bookingId;

  if (actor?.portalType === 'DRIVER' || query.mine === 'true' || query.mine === true) {
    let driverId = linkedId(actor?.linkedDriver);
    if (!driverId && actor?._id) {
      const owned = await Driver.findOne({ user: actor._id }).select('_id');
      driverId = owned?._id;
    }
    if (driverId) filter.driver = driverId;
    else if (actor?.portalType === 'DRIVER') filter._id = { $exists: false };
  }

  if (actor?.portalType === 'CUSTOMER') {
    const customerId = linkedId(actor.linkedCustomer);
    if (customerId) {
      const bookingIds = await Booking.find({ customer: customerId }).distinct('_id');
      filter.booking = { $in: bookingIds };
    } else {
      filter._id = { $exists: false };
    }
  }
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  const [items, total] = await Promise.all([
    Trip.find(filter)
      .populate({
        path: 'booking',
        select: 'bookingNumber status source customer pickup delivery charges',
        populate: { path: 'customer', select: 'name company' },
      })
      .populate('vehicle', 'registrationNumber type status currentKm')
      .populate('driver', 'name mobile status')
      .populate('route', 'name origin destination')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Trip.countDocuments(filter),
  ]);
  const presented = items.map((trip) => {
    const obj = trip.toObject();
    if (obj.booking) obj.booking = presentBooking(obj.booking);
    return obj;
  });
  return { items: presented, meta: buildMeta({ page, limit, total }) };
}

export async function getTripById(id) {
  const trip = await Trip.findById(id)
    .populate({
      path: 'booking',
      populate: { path: 'customer', select: 'name company mobile email' },
    })
    .populate('vehicle', 'registrationNumber type status currentKm')
    .populate('driver', 'name mobile status licenseNumber')
    .populate('route', 'name origin destination stops distanceKm')
    .populate('createdBy', 'name email');
  if (!trip) throw new ApiError(404, 'Trip not found');
  const obj = trip.toObject();
  if (obj.booking) obj.booking = presentBooking(obj.booking);
  return obj;
}

export async function createTrip(payload, actor, req) {
  const booking = await Booking.findById(payload.bookingId);
  if (!booking) throw new ApiError(400, 'Invalid booking');
  if (['CANCELLED', 'COMPLETED'].includes(booking.status)) {
    throw new ApiError(400, `Cannot create trip for ${booking.status} booking`);
  }
  if (booking.trip) {
    const existing = await Trip.findById(booking.trip);
    if (existing && existing.status !== 'CANCELLED') {
      throw new ApiError(409, 'Booking already has an active trip');
    }
  }

  const tripData = {
    tripNumber: await nextTripNumber(),
    booking: booking._id,
    route: payload.routeId || booking.route || undefined,
    helper: payload.helper,
    startKm: payload.startKm ?? 0,
    notes: payload.notes || '',
    createdBy: actor._id,
    status: 'PLANNED',
  };

  if (payload.vehicleId && payload.driverId) {
    const { vehicle, driver } = await assertAssignable(payload.vehicleId, payload.driverId);
    tripData.vehicle = vehicle._id;
    tripData.driver = driver._id;
    tripData.startKm = payload.startKm ?? vehicle.currentKm ?? 0;
    tripData.status = 'ASSIGNED';
  }

  const trip = await Trip.create(tripData);

  if (trip.status === 'ASSIGNED') {
    await Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'ON_TRIP' });
    await Driver.findByIdAndUpdate(trip.driver, { status: 'ON_TRIP' });
    if (['DRAFT', 'CONFIRMED'].includes(booking.status)) {
      booking.status = 'ASSIGNED';
    }
  }

  booking.trip = trip._id;
  await booking.save();

  await writeAuditLog({
    actor,
    module: 'trips',
    entity: 'Trip',
    entityId: trip._id,
    action: 'CREATE',
    description: `${actor.email} created trip ${trip.tripNumber}`,
    req,
  });
  return getTripById(trip._id);
}

export async function assignTrip(id, payload, actor, req) {
  const trip = await Trip.findById(id);
  if (!trip) throw new ApiError(404, 'Trip not found');
  if (!['PLANNED', 'PENDING', 'ASSIGNED'].includes(trip.status)) {
    throw new ApiError(400, `Cannot assign trip in ${trip.status} status`);
  }

  // Release previous assignment if reassigning
  if (trip.vehicle && String(trip.vehicle) !== payload.vehicleId) {
    await Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'AVAILABLE' });
  }
  if (trip.driver && String(trip.driver) !== payload.driverId) {
    await Driver.findByIdAndUpdate(trip.driver, { status: 'AVAILABLE' });
  }

  const { vehicle, driver } = await assertAssignable(payload.vehicleId, payload.driverId, {
    excludeTripId: trip._id,
    allowVehicleId: trip.vehicle,
    allowDriverId: trip.driver,
  });

  trip.vehicle = vehicle._id;
  trip.driver = driver._id;
  trip.helper = payload.helper || trip.helper;
  trip.startKm = payload.startKm ?? vehicle.currentKm ?? trip.startKm;
  trip.status = 'ASSIGNED';
  await trip.save();

  await Vehicle.findByIdAndUpdate(vehicle._id, { status: 'ON_TRIP' });
  await Driver.findByIdAndUpdate(driver._id, { status: 'ON_TRIP' });

  const booking = await Booking.findById(trip.booking);
  if (booking && ['DRAFT', 'CONFIRMED'].includes(booking.status)) {
    booking.status = 'ASSIGNED';
    await booking.save();
  }

  await writeAuditLog({
    actor,
    module: 'trips',
    entity: 'Trip',
    entityId: trip._id,
    action: 'ASSIGN',
    description: `${actor.email} assigned vehicle/driver to ${trip.tripNumber}`,
    req,
  });
  return getTripById(trip._id);
}

export async function updateTrip(id, payload, actor, req) {
  const trip = await Trip.findById(id);
  if (!trip) throw new ApiError(404, 'Trip not found');
  if (['COMPLETED', 'CANCELLED'].includes(trip.status)) {
    throw new ApiError(400, `Cannot edit trip in ${trip.status} status`);
  }

  if (payload.helper !== undefined) trip.helper = payload.helper;
  if (payload.routeId !== undefined) trip.route = payload.routeId || undefined;
  if (payload.startKm !== undefined) trip.startKm = payload.startKm;
  if (payload.endKm !== undefined) trip.endKm = payload.endKm;
  if (payload.notes !== undefined) trip.notes = payload.notes;
  await trip.save();

  await writeAuditLog({
    actor,
    module: 'trips',
    entity: 'Trip',
    entityId: trip._id,
    action: 'UPDATE',
    description: `${actor.email} updated trip ${trip.tripNumber}`,
    req,
  });
  return getTripById(trip._id);
}

export async function transitionTrip(id, { status, endKm, reason }, actor, req) {
  const trip = await Trip.findById(id);
  if (!trip) throw new ApiError(404, 'Trip not found');

  const nextStatus = normalizeTripStatus(status) === 'IN_TRANSIT' && status === 'IN_PROGRESS' ? 'IN_TRANSIT' : status;
  const canonical = nextStatus === 'IN_PROGRESS' ? 'IN_TRANSIT' : nextStatus === 'PENDING' ? 'PLANNED' : nextStatus;

  const allowed = TRIP_TRANSITIONS[trip.status] || [];
  if (!allowed.includes(status) && !allowed.includes(canonical)) {
    throw new ApiError(400, `Cannot transition from ${trip.status} to ${status}`);
  }

  if (['STARTED', 'IN_PROGRESS', 'IN_TRANSIT'].includes(canonical) && (!trip.vehicle || !trip.driver)) {
    throw new ApiError(400, 'Assign vehicle and driver before starting trip');
  }

  const oldStatus = trip.status;
  trip.status = ['IN_PROGRESS', 'IN_TRANSIT'].includes(status) ? 'IN_TRANSIT' : canonical;

  if (status === 'STARTED' || canonical === 'STARTED') {
    trip.startTime = trip.startTime || new Date();
    const booking = await Booking.findById(trip.booking);
    if (booking && booking.status === 'ASSIGNED') {
      booking.status = 'IN_TRANSIT';
      await booking.save();
    }
  }

  if (['IN_PROGRESS', 'IN_TRANSIT'].includes(trip.status) && !trip.startTime) {
    trip.startTime = new Date();
    const booking = await Booking.findById(trip.booking);
    if (booking && booking.status === 'ASSIGNED') {
      booking.status = 'IN_TRANSIT';
      await booking.save();
    }
  }

  if (status === 'COMPLETED') {
    trip.endTime = new Date();
    if (endKm !== undefined) trip.endKm = endKm;
    if (trip.endKm != null && trip.startKm != null) {
      trip.distanceKm = Math.max(0, trip.endKm - trip.startKm);
    }
    if (trip.vehicle && trip.endKm != null) {
      await Vehicle.findByIdAndUpdate(trip.vehicle, {
        status: 'AVAILABLE',
        currentKm: trip.endKm,
      });
    } else if (trip.vehicle) {
      await Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'AVAILABLE' });
    }
    if (trip.driver) await Driver.findByIdAndUpdate(trip.driver, { status: 'AVAILABLE' });

    const booking = await Booking.findById(trip.booking);
    if (booking) {
      booking.status = 'DELIVERED';
      await booking.save();
    }
    trip.locationSharing = false;
  }

  if (status === 'CANCELLED') {
    if (trip.vehicle) await Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'AVAILABLE' });
    if (trip.driver) await Driver.findByIdAndUpdate(trip.driver, { status: 'AVAILABLE' });
    trip.notes = [trip.notes, reason].filter(Boolean).join(' | ');
    trip.locationSharing = false;
  }

  await trip.save();
  await writeAuditLog({
    actor,
    module: 'trips',
    entity: 'Trip',
    entityId: trip._id,
    action: 'STATUS_CHANGE',
    description: `${actor.email} changed trip ${trip.tripNumber} ${oldStatus} → ${status}`,
    oldValue: { status: oldStatus },
    newValue: { status },
    req,
  });
  return getTripById(trip._id);
}
