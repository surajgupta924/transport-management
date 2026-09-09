import { Driver, DriverDocument } from './driver.model.js';
import { User } from '../users/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';

function mapPayload(payload) {
  const data = { ...payload };
  if (payload.branchId !== undefined) {
    data.branch = payload.branchId || undefined;
    delete data.branchId;
  }
  if (payload.userId !== undefined) {
    data.user = payload.userId || undefined;
    delete data.userId;
  }
  if (data.licenseNumber) data.licenseNumber = data.licenseNumber.toUpperCase().trim();
  if (data.email === '') data.email = undefined;
  return data;
}

export async function listDrivers(query) {
  const { page, limit, skip, sort, search } = parsePagination(query);
  const filter = {};
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { mobile: new RegExp(search, 'i') },
      { licenseNumber: new RegExp(search, 'i') },
      { employeeId: new RegExp(search, 'i') },
    ];
  }
  if (query.status) filter.status = query.status;
  if (query.branchId) filter.branch = query.branchId;

  const [items, total] = await Promise.all([
    Driver.find(filter)
      .populate('branch', 'name code')
      .populate('user', 'name email status')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Driver.countDocuments(filter),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getDriverById(id) {
  const driver = await Driver.findById(id)
    .populate('branch', 'name code')
    .populate('user', 'name email status');
  if (!driver) throw new ApiError(404, 'Driver not found');
  const documents = await DriverDocument.find({ driver: id }).sort({ expiryDate: 1 });
  return { ...driver.toObject(), documents };
}

export async function createDriver(payload, actor, req) {
  const data = mapPayload(payload);
  if (await Driver.findOne({ mobile: data.mobile })) {
    throw new ApiError(409, 'Driver mobile already exists');
  }
  if (await Driver.findOne({ licenseNumber: data.licenseNumber })) {
    throw new ApiError(409, 'License number already exists');
  }
  if (data.user) {
    const user = await User.findById(data.user);
    if (!user) throw new ApiError(400, 'Invalid user link');
  }

  const driver = await Driver.create(data);
  if (driver.user) {
    await User.findByIdAndUpdate(driver.user, { linkedDriver: driver._id, portalType: 'DRIVER' });
  }

  await writeAuditLog({
    actor,
    module: 'drivers',
    entity: 'Driver',
    entityId: driver._id,
    action: 'CREATE',
    description: `${actor.email} created driver ${driver.name}`,
    req,
  });
  return driver;
}

export async function updateDriver(id, payload, actor, req) {
  const driver = await Driver.findById(id);
  if (!driver) throw new ApiError(404, 'Driver not found');
  const data = mapPayload(payload);

  if (data.mobile && data.mobile !== driver.mobile) {
    if (await Driver.findOne({ mobile: data.mobile })) throw new ApiError(409, 'Driver mobile already exists');
  }
  if (data.licenseNumber && data.licenseNumber !== driver.licenseNumber) {
    if (await Driver.findOne({ licenseNumber: data.licenseNumber })) {
      throw new ApiError(409, 'License number already exists');
    }
  }

  Object.assign(driver, data);
  await driver.save();

  if (driver.user) {
    await User.findByIdAndUpdate(driver.user, { linkedDriver: driver._id });
  }

  await writeAuditLog({
    actor,
    module: 'drivers',
    entity: 'Driver',
    entityId: driver._id,
    action: 'UPDATE',
    description: `${actor.email} updated driver ${driver.name}`,
    req,
  });
  return driver;
}

export async function deleteDriver(id, actor, req) {
  const driver = await Driver.findById(id);
  if (!driver) throw new ApiError(404, 'Driver not found');
  await DriverDocument.deleteMany({ driver: id });
  await driver.deleteOne();
  await writeAuditLog({
    actor,
    module: 'drivers',
    entity: 'Driver',
    entityId: id,
    action: 'DELETE',
    description: `${actor.email} deleted driver ${driver.name}`,
    req,
  });
  return { deleted: true };
}

export async function listDocuments(driverId) {
  const driver = await Driver.findById(driverId);
  if (!driver) throw new ApiError(404, 'Driver not found');
  return DriverDocument.find({ driver: driverId }).sort({ expiryDate: 1 });
}

export async function addDocument(driverId, payload, actor, req) {
  const driver = await Driver.findById(driverId);
  if (!driver) throw new ApiError(404, 'Driver not found');
  const doc = await DriverDocument.create({ ...payload, driver: driverId });
  await writeAuditLog({
    actor,
    module: 'drivers',
    entity: 'DriverDocument',
    entityId: doc._id,
    action: 'CREATE',
    description: `${actor.email} added ${doc.type} for driver ${driver.name}`,
    req,
  });
  return doc;
}

export async function updateDocument(driverId, docId, payload, actor, req) {
  const doc = await DriverDocument.findOne({ _id: docId, driver: driverId });
  if (!doc) throw new ApiError(404, 'Document not found');
  Object.assign(doc, payload);
  await doc.save();
  return doc;
}

export async function deleteDocument(driverId, docId) {
  const doc = await DriverDocument.findOne({ _id: docId, driver: driverId });
  if (!doc) throw new ApiError(404, 'Document not found');
  await doc.deleteOne();
  return { deleted: true };
}

export async function hasExpiredDocuments(driverId) {
  const now = new Date();
  const driver = await Driver.findById(driverId);
  if (driver?.licenseExpiry && driver.licenseExpiry < now) return true;
  const expired = await DriverDocument.findOne({ driver: driverId, expiryDate: { $lt: now } });
  return Boolean(expired);
}
