import { Vendor, VendorTransaction } from './vendor.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';

export async function listVendors(query) {
  const { page, limit, skip, sort, search } = parsePagination(query);
  const filter = {};
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
      { code: new RegExp(search, 'i') },
    ];
  }
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;

  const [items, total] = await Promise.all([
    Vendor.find(filter).sort(sort).skip(skip).limit(limit),
    Vendor.countDocuments(filter),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getVendorById(id) {
  const vendor = await Vendor.findById(id);
  if (!vendor) throw new ApiError(404, 'Vendor not found');
  return vendor;
}

export async function createVendor(payload, actor, req) {
  const vendor = await Vendor.create(payload);
  await writeAuditLog({
    actor,
    module: 'vendors',
    entity: 'Vendor',
    entityId: vendor._id,
    action: 'CREATE',
    description: `${actor.email} created vendor ${vendor.name}`,
    req,
  });
  return vendor;
}

export async function updateVendor(id, payload, actor, req) {
  const vendor = await Vendor.findById(id);
  if (!vendor) throw new ApiError(404, 'Vendor not found');
  Object.assign(vendor, payload);
  await vendor.save();
  await writeAuditLog({
    actor,
    module: 'vendors',
    entity: 'Vendor',
    entityId: vendor._id,
    action: 'UPDATE',
    description: `${actor.email} updated vendor ${vendor.name}`,
    req,
  });
  return vendor;
}

export async function deleteVendor(id, actor, req) {
  const vendor = await Vendor.findById(id);
  if (!vendor) throw new ApiError(404, 'Vendor not found');
  await vendor.deleteOne();
  await writeAuditLog({
    actor,
    module: 'vendors',
    entity: 'Vendor',
    entityId: id,
    action: 'DELETE',
    description: `${actor.email} deleted vendor ${vendor.name}`,
    req,
  });
  return { deleted: true };
}

export async function listVendorTransactions(vendorId, query) {
  await getVendorById(vendorId);
  const { page, limit, skip, sort } = parsePagination(query);
  const filter = { vendor: vendorId };
  const [items, total] = await Promise.all([
    VendorTransaction.find(filter).sort(sort).skip(skip).limit(limit),
    VendorTransaction.countDocuments(filter),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function addVendorTransaction(vendorId, payload, actor, req) {
  const vendor = await getVendorById(vendorId);
  const delta = payload.type === 'DEBIT' ? payload.amount : -payload.amount;
  vendor.balance = Number(((vendor.balance || 0) + delta).toFixed(2));
  await vendor.save();

  const txn = await VendorTransaction.create({
    vendor: vendor._id,
    type: payload.type,
    amount: payload.amount,
    balanceAfter: vendor.balance,
    referenceType: payload.referenceType || 'OTHER',
    referenceId: payload.referenceId || undefined,
    description: payload.description || '',
    date: payload.date || new Date(),
    createdBy: actor._id,
  });

  await writeAuditLog({
    actor,
    module: 'vendors',
    entity: 'VendorTransaction',
    entityId: txn._id,
    action: 'CREATE',
    description: `${actor.email} added ${payload.type} txn for ${vendor.name}`,
    req,
  });
  return txn;
}
