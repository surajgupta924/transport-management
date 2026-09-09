import { MaintenanceRecord } from './maintenance.model.js';
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
  if (payload.vendorId !== undefined) {
    data.vendor = payload.vendorId || undefined;
    delete data.vendorId;
  }
  if (data.cost == null && (data.partsCost != null || data.laborCost != null)) {
    data.cost = (data.partsCost || 0) + (data.laborCost || 0);
  }
  return data;
}

export async function listMaintenance(query) {
  const { page, limit, skip, sort, search } = parsePagination(query);
  const filter = {};
  if (query.vehicleId) filter.vehicle = query.vehicleId;
  if (query.vendorId) filter.vendor = query.vendorId;
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (search) filter.title = new RegExp(search, 'i');
  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = new Date(query.from);
    if (query.to) filter.date.$lte = new Date(query.to);
  }

  const [items, total] = await Promise.all([
    MaintenanceRecord.find(filter)
      .populate('vehicle', 'registrationNumber')
      .populate('vendor', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    MaintenanceRecord.countDocuments(filter),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getMaintenanceById(id) {
  const record = await MaintenanceRecord.findById(id)
    .populate('vehicle', 'registrationNumber nextServiceKm nextServiceDate')
    .populate('vendor', 'name phone');
  if (!record) throw new ApiError(404, 'Maintenance record not found');
  return record;
}

export async function createMaintenance(payload, actor, req) {
  const vehicle = await Vehicle.findById(payload.vehicleId);
  if (!vehicle) throw new ApiError(400, 'Invalid vehicle');

  const data = mapPayload(payload);
  data.createdBy = actor._id;
  const record = await MaintenanceRecord.create(data);

  if (data.nextServiceKm != null) vehicle.nextServiceKm = data.nextServiceKm;
  if (data.nextServiceDate != null) vehicle.nextServiceDate = data.nextServiceDate;
  if (data.status === 'IN_PROGRESS') vehicle.status = 'MAINTENANCE';
  if (data.status === 'COMPLETED' && vehicle.status === 'MAINTENANCE') vehicle.status = 'AVAILABLE';
  if (data.odometerKm != null && data.odometerKm > (vehicle.currentKm || 0)) {
    vehicle.currentKm = data.odometerKm;
  }
  await vehicle.save();

  await writeAuditLog({
    actor,
    module: 'maintenance',
    entity: 'MaintenanceRecord',
    entityId: record._id,
    action: 'CREATE',
    description: `${actor.email} created maintenance for ${vehicle.registrationNumber}`,
    req,
  });
  return getMaintenanceById(record._id);
}

export async function updateMaintenance(id, payload, actor, req) {
  const record = await MaintenanceRecord.findById(id);
  if (!record) throw new ApiError(404, 'Maintenance record not found');
  const data = mapPayload(payload);
  Object.assign(record, data);
  await record.save();

  const vehicle = await Vehicle.findById(record.vehicle);
  if (vehicle) {
    if (record.nextServiceKm != null) vehicle.nextServiceKm = record.nextServiceKm;
    if (record.nextServiceDate != null) vehicle.nextServiceDate = record.nextServiceDate;
    if (record.status === 'IN_PROGRESS') vehicle.status = 'MAINTENANCE';
    if (record.status === 'COMPLETED' && vehicle.status === 'MAINTENANCE') vehicle.status = 'AVAILABLE';
    await vehicle.save();
  }

  await writeAuditLog({
    actor,
    module: 'maintenance',
    entity: 'MaintenanceRecord',
    entityId: record._id,
    action: 'UPDATE',
    description: `${actor.email} updated maintenance record`,
    req,
  });
  return getMaintenanceById(record._id);
}

export async function deleteMaintenance(id, actor, req) {
  const record = await MaintenanceRecord.findById(id);
  if (!record) throw new ApiError(404, 'Maintenance record not found');
  await record.deleteOne();
  await writeAuditLog({
    actor,
    module: 'maintenance',
    entity: 'MaintenanceRecord',
    entityId: id,
    action: 'DELETE',
    description: `${actor.email} deleted maintenance record`,
    req,
  });
  return { deleted: true };
}
