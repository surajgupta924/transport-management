import { HiredVehicle, HiredTrip, HiredPayment } from './hiredVehicle.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';

export async function listHiredVehicles(query) {
  const { page, limit, skip, sort, search } = parsePagination(query);
  const filter = {};
  if (search) {
    filter.$or = [
      { registrationNumber: new RegExp(search, 'i') },
      { ownerName: new RegExp(search, 'i') },
      { driverName: new RegExp(search, 'i') },
    ];
  }
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    HiredVehicle.find(filter).sort(sort).skip(skip).limit(limit),
    HiredVehicle.countDocuments(filter),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getDashboard() {
  const [vehicles, trips, freightAgg, paidAgg] = await Promise.all([
    HiredVehicle.countDocuments(),
    HiredTrip.countDocuments(),
    HiredTrip.aggregate([{ $group: { _id: null, total: { $sum: '$freight' } } }]),
    HiredPayment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);
  const freight = freightAgg[0]?.total || 0;
  const paid = paidAgg[0]?.total || 0;
  return {
    totalVehicles: vehicles,
    totalTrips: trips,
    totalFreight: freight,
    outstandingBalance: Math.max(0, freight - paid),
  };
}

export async function getHiredVehicle(id) {
  const vehicle = await HiredVehicle.findById(id);
  if (!vehicle) throw new ApiError(404, 'Hired vehicle not found');
  const [trips, payments] = await Promise.all([
    HiredTrip.find({ hiredVehicle: id }).sort({ tripDate: -1 }),
    HiredPayment.find({ hiredVehicle: id }).sort({ paidAt: -1 }),
  ]);
  const freight = trips.reduce((sum, t) => sum + (t.freight || 0), 0);
  const paid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  return { ...vehicle.toObject(), trips, payments, freight, paid, outstanding: Math.max(0, freight - paid) };
}

export async function createHiredVehicle(payload, actor, req) {
  const existing = await HiredVehicle.findOne({
    registrationNumber: String(payload.registrationNumber).toUpperCase().trim(),
  });
  if (existing) throw new ApiError(409, 'Registration number already exists');
  const vehicle = await HiredVehicle.create({
    ...payload,
    registrationNumber: String(payload.registrationNumber).toUpperCase().trim(),
    createdBy: actor._id,
  });
  await writeAuditLog({
    actor,
    module: 'hiredVehicles',
    entity: 'HiredVehicle',
    entityId: vehicle._id,
    action: 'CREATE',
    description: `${actor.email} registered hired vehicle ${vehicle.registrationNumber}`,
    req,
  });
  return vehicle;
}

export async function updateHiredVehicle(id, payload, actor, req) {
  const vehicle = await HiredVehicle.findById(id);
  if (!vehicle) throw new ApiError(404, 'Hired vehicle not found');
  if (payload.registrationNumber) {
    payload.registrationNumber = String(payload.registrationNumber).toUpperCase().trim();
  }
  Object.assign(vehicle, payload);
  await vehicle.save();
  await writeAuditLog({
    actor,
    module: 'hiredVehicles',
    entity: 'HiredVehicle',
    entityId: vehicle._id,
    action: 'UPDATE',
    description: `${actor.email} updated hired vehicle ${vehicle.registrationNumber}`,
    req,
  });
  return vehicle;
}

export async function deleteHiredVehicle(id, actor, req) {
  const vehicle = await HiredVehicle.findById(id);
  if (!vehicle) throw new ApiError(404, 'Hired vehicle not found');
  await HiredTrip.deleteMany({ hiredVehicle: id });
  await HiredPayment.deleteMany({ hiredVehicle: id });
  await vehicle.deleteOne();
  await writeAuditLog({
    actor,
    module: 'hiredVehicles',
    entity: 'HiredVehicle',
    entityId: id,
    action: 'DELETE',
    description: `${actor.email} deleted hired vehicle ${vehicle.registrationNumber}`,
    req,
  });
  return { deleted: true };
}

export async function listHiredTrips(query) {
  const { page, limit, skip, sort, search } = parsePagination(query);
  const filter = {};
  if (query.hiredVehicleId) filter.hiredVehicle = query.hiredVehicleId;
  if (query.status) filter.status = query.status;
  if (search) {
    filter.$or = [{ origin: new RegExp(search, 'i') }, { destination: new RegExp(search, 'i') }];
  }
  const [items, total] = await Promise.all([
    HiredTrip.find(filter).populate('hiredVehicle', 'registrationNumber type driverName').sort(sort).skip(skip).limit(limit),
    HiredTrip.countDocuments(filter),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function createHiredTrip(payload, actor, req) {
  const vehicle = await HiredVehicle.findById(payload.hiredVehicleId);
  if (!vehicle) throw new ApiError(400, 'Invalid hired vehicle');
  const trip = await HiredTrip.create({
    hiredVehicle: vehicle._id,
    origin: payload.origin,
    destination: payload.destination,
    freight: payload.freight || 0,
    tripDate: payload.tripDate || new Date(),
    status: payload.status || 'PLANNED',
    notes: payload.notes || '',
    createdBy: actor._id,
  });
  if (trip.status === 'IN_TRANSIT') vehicle.status = 'ON_TRIP';
  if (trip.status === 'COMPLETED') vehicle.status = 'ACTIVE';
  await vehicle.save();
  return trip.populate('hiredVehicle', 'registrationNumber type driverName');
}

export async function listHiredPayments(query) {
  const { page, limit, skip, sort } = parsePagination(query);
  const filter = {};
  if (query.hiredVehicleId) filter.hiredVehicle = query.hiredVehicleId;
  const [items, total] = await Promise.all([
    HiredPayment.find(filter).populate('hiredVehicle', 'registrationNumber').sort(sort).skip(skip).limit(limit),
    HiredPayment.countDocuments(filter),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function createHiredPayment(payload, actor, req) {
  const vehicle = await HiredVehicle.findById(payload.hiredVehicleId);
  if (!vehicle) throw new ApiError(400, 'Invalid hired vehicle');
  return HiredPayment.create({
    hiredVehicle: vehicle._id,
    amount: payload.amount,
    method: payload.method || 'CASH',
    reference: payload.reference,
    paidAt: payload.paidAt || new Date(),
    notes: payload.notes || '',
    createdBy: actor._id,
  });
}
