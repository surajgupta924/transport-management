import { FuelRecord, calcKmPerLiter } from './fuel.model.js';
import { Vehicle } from '../vehicles/vehicle.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';

function mapPayload(payload) {
  const data = { ...payload };
  if (payload.vehicleId) {
    data.vehicle = payload.vehicleId;
    delete data.vehicleId;
  }
  if (payload.driverId !== undefined) {
    data.driver = payload.driverId || undefined;
    delete data.driverId;
  }
  if (payload.tripId !== undefined) {
    data.trip = payload.tripId || undefined;
    delete data.tripId;
  }
  if (data.totalAmount == null && data.pricePerLiter != null && data.liters != null) {
    data.totalAmount = Number((data.pricePerLiter * data.liters).toFixed(2));
  }
  return data;
}

export async function listFuel(query) {
  const { page, limit, skip, sort, search } = parsePagination(query);
  const filter = {};
  if (query.vehicleId) filter.vehicle = query.vehicleId;
  if (query.driverId) filter.driver = query.driverId;
  if (query.tripId) filter.trip = query.tripId;
  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = new Date(query.from);
    if (query.to) filter.date.$lte = new Date(query.to);
  }
  if (search) filter.station = new RegExp(search, 'i');

  const [items, total] = await Promise.all([
    FuelRecord.find(filter)
      .populate('vehicle', 'registrationNumber')
      .populate('driver', 'name mobile')
      .populate('trip', 'tripNumber')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    FuelRecord.countDocuments(filter),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getFuelById(id) {
  const record = await FuelRecord.findById(id)
    .populate('vehicle', 'registrationNumber')
    .populate('driver', 'name mobile')
    .populate('trip', 'tripNumber');
  if (!record) throw new ApiError(404, 'Fuel record not found');
  return record;
}

export async function createFuel(payload, actor, req) {
  const vehicle = await Vehicle.findById(payload.vehicleId);
  if (!vehicle) throw new ApiError(400, 'Invalid vehicle');

  const data = mapPayload(payload);
  data.createdBy = actor._id;

  const prev = await FuelRecord.findOne({ vehicle: data.vehicle }).sort({ odometerKm: -1, date: -1 });
  data.kmPerLiter = calcKmPerLiter(prev?.odometerKm, data.odometerKm, data.liters);

  const record = await FuelRecord.create(data);
  if (data.odometerKm > (vehicle.currentKm || 0)) {
    vehicle.currentKm = data.odometerKm;
    await vehicle.save();
  }

  await writeAuditLog({
    actor,
    module: 'fuel',
    entity: 'FuelRecord',
    entityId: record._id,
    action: 'CREATE',
    description: `${actor.email} logged fuel for ${vehicle.registrationNumber}`,
    req,
  });
  return getFuelById(record._id);
}

export async function updateFuel(id, payload, actor, req) {
  const record = await FuelRecord.findById(id);
  if (!record) throw new ApiError(404, 'Fuel record not found');
  const data = mapPayload(payload);
  Object.assign(record, data);

  const prev = await FuelRecord.findOne({
    vehicle: record.vehicle,
    _id: { $ne: record._id },
    odometerKm: { $lte: record.odometerKm },
  }).sort({ odometerKm: -1 });
  record.kmPerLiter = calcKmPerLiter(prev?.odometerKm, record.odometerKm, record.liters);
  await record.save();

  await writeAuditLog({
    actor,
    module: 'fuel',
    entity: 'FuelRecord',
    entityId: record._id,
    action: 'UPDATE',
    description: `${actor.email} updated fuel record`,
    req,
  });
  return getFuelById(record._id);
}

export async function deleteFuel(id, actor, req) {
  const record = await FuelRecord.findById(id);
  if (!record) throw new ApiError(404, 'Fuel record not found');
  await record.deleteOne();
  await writeAuditLog({
    actor,
    module: 'fuel',
    entity: 'FuelRecord',
    entityId: id,
    action: 'DELETE',
    description: `${actor.email} deleted fuel record`,
    req,
  });
  return { deleted: true };
}
