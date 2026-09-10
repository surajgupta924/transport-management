import { Vehicle, VehicleDocument } from './vehicle.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';

function mapPayload(payload) {
  const data = { ...payload };
  if (payload.branchId !== undefined) {
    data.branch = payload.branchId || undefined;
    delete data.branchId;
  }
  if (data.registrationNumber) data.registrationNumber = data.registrationNumber.toUpperCase().trim();
  if (data.gpsDeviceId) data.gpsDeviceId = data.gpsDeviceId.toUpperCase().trim();
  return data;
}

export async function listVehicles(query) {
  const { page, limit, skip, sort, search } = parsePagination(query);
  const filter = {};
  if (search) {
    filter.$or = [
      { registrationNumber: new RegExp(search, 'i') },
      { manufacturer: new RegExp(search, 'i') },
      { model: new RegExp(search, 'i') },
      { chassisNumber: new RegExp(search, 'i') },
    ];
  }
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.fuelType) filter.fuelType = query.fuelType;
  if (query.branchId) filter.branch = query.branchId;

  const [items, total] = await Promise.all([
    Vehicle.find(filter).populate('branch', 'name code').sort(sort).skip(skip).limit(limit),
    Vehicle.countDocuments(filter),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getVehicleById(id) {
  const vehicle = await Vehicle.findById(id).populate('branch', 'name code');
  if (!vehicle) throw new ApiError(404, 'Vehicle not found');
  const documents = await VehicleDocument.find({ vehicle: id }).sort({ expiryDate: 1 });
  return { ...vehicle.toObject(), documents };
}

export async function createVehicle(payload, actor, req) {
  const data = mapPayload(payload);
  const existing = await Vehicle.findOne({ registrationNumber: data.registrationNumber });
  if (existing) throw new ApiError(409, 'Registration number already exists');

  const vehicle = await Vehicle.create(data);
  await writeAuditLog({
    actor,
    module: 'vehicles',
    entity: 'Vehicle',
    entityId: vehicle._id,
    action: 'CREATE',
    description: `${actor.email} created vehicle ${vehicle.registrationNumber}`,
    req,
  });
  return vehicle;
}

export async function updateVehicle(id, payload, actor, req) {
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) throw new ApiError(404, 'Vehicle not found');
  const data = mapPayload(payload);

  if (data.registrationNumber && data.registrationNumber !== vehicle.registrationNumber) {
    const existing = await Vehicle.findOne({ registrationNumber: data.registrationNumber });
    if (existing) throw new ApiError(409, 'Registration number already exists');
  }

  Object.assign(vehicle, data);
  await vehicle.save();
  await writeAuditLog({
    actor,
    module: 'vehicles',
    entity: 'Vehicle',
    entityId: vehicle._id,
    action: 'UPDATE',
    description: `${actor.email} updated vehicle ${vehicle.registrationNumber}`,
    req,
  });
  return vehicle;
}

export async function deleteVehicle(id, actor, req) {
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) throw new ApiError(404, 'Vehicle not found');
  await VehicleDocument.deleteMany({ vehicle: id });
  await vehicle.deleteOne();
  await writeAuditLog({
    actor,
    module: 'vehicles',
    entity: 'Vehicle',
    entityId: id,
    action: 'DELETE',
    description: `${actor.email} deleted vehicle ${vehicle.registrationNumber}`,
    req,
  });
  return { deleted: true };
}

export async function listDocuments(vehicleId) {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) throw new ApiError(404, 'Vehicle not found');
  return VehicleDocument.find({ vehicle: vehicleId }).sort({ expiryDate: 1 });
}

export async function addDocument(vehicleId, payload, actor, req) {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) throw new ApiError(404, 'Vehicle not found');
  const doc = await VehicleDocument.create({ ...payload, vehicle: vehicleId });
  await writeAuditLog({
    actor,
    module: 'vehicles',
    entity: 'VehicleDocument',
    entityId: doc._id,
    action: 'CREATE',
    description: `${actor.email} added ${doc.type} document for ${vehicle.registrationNumber}`,
    req,
  });
  return doc;
}

export async function updateDocument(vehicleId, docId, payload, actor, req) {
  const doc = await VehicleDocument.findOne({ _id: docId, vehicle: vehicleId });
  if (!doc) throw new ApiError(404, 'Document not found');
  Object.assign(doc, payload);
  await doc.save();
  await writeAuditLog({
    actor,
    module: 'vehicles',
    entity: 'VehicleDocument',
    entityId: doc._id,
    action: 'UPDATE',
    description: `${actor.email} updated vehicle document`,
    req,
  });
  return doc;
}

export async function deleteDocument(vehicleId, docId, actor, req) {
  const doc = await VehicleDocument.findOne({ _id: docId, vehicle: vehicleId });
  if (!doc) throw new ApiError(404, 'Document not found');
  await doc.deleteOne();
  await writeAuditLog({
    actor,
    module: 'vehicles',
    entity: 'VehicleDocument',
    entityId: docId,
    action: 'DELETE',
    description: `${actor.email} deleted vehicle document`,
    req,
  });
  return { deleted: true };
}

export async function hasExpiredDocuments(vehicleId) {
  const now = new Date();
  const expired = await VehicleDocument.findOne({
    vehicle: vehicleId,
    expiryDate: { $lt: now },
  });
  return Boolean(expired);
}
