import { CustomerLedger } from './ledger.model.js';
import { Customer } from '../customers/customer.model.js';
import { Vendor, VendorTransaction } from '../vendors/vendor.model.js';
import { recalcCustomerBalance } from '../invoices/invoice.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';
import { toCsv } from '../../utils/csv.js';

export async function listCustomerLedger(query) {
  const { page, limit, skip, sort } = parsePagination(query);
  const filter = {};
  if (query.customerId) filter.customer = query.customerId;
  if (query.type) filter.type = query.type;
  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = new Date(query.from);
    if (query.to) filter.date.$lte = new Date(query.to);
  }

  const [items, total] = await Promise.all([
    CustomerLedger.find(filter)
      .populate('customer', 'name company')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    CustomerLedger.countDocuments(filter),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getCustomerLedgerSummary(customerId) {
  const customer = await Customer.findById(customerId).select('name company outstandingBalance');
  if (!customer) throw new ApiError(404, 'Customer not found');
  const entries = await CustomerLedger.find({ customer: customerId }).sort({ date: -1 }).limit(50);
  return { customer, outstandingBalance: customer.outstandingBalance || 0, recent: entries };
}

export async function createAdjustment(payload, actor, req) {
  const customer = await Customer.findById(payload.customerId);
  if (!customer) throw new ApiError(400, 'Invalid customer');

  const entry = await CustomerLedger.create({
    customer: customer._id,
    type: payload.type,
    amount: payload.amount,
    balanceAfter: 0,
    referenceType: payload.referenceType || 'ADJUSTMENT',
    referenceId: payload.referenceId || undefined,
    description: payload.description || 'Manual adjustment',
    date: payload.date || new Date(),
    createdBy: actor._id,
  });

  await recalcCustomerBalance(customer._id);
  await writeAuditLog({
    actor,
    module: 'ledger',
    entity: 'CustomerLedger',
    entityId: entry._id,
    action: 'CREATE',
    description: `${actor.email} added ledger ${payload.type} for ${customer.name}`,
    req,
  });
  return entry;
}

export async function listVendorLedger(query) {
  const { page, limit, skip, sort } = parsePagination(query);
  const filter = {};
  if (query.vendorId) filter.vendor = query.vendorId;
  if (query.type) filter.type = query.type;

  const [items, total] = await Promise.all([
    VendorTransaction.find(filter).populate('vendor', 'name balance').sort(sort).skip(skip).limit(limit),
    VendorTransaction.countDocuments(filter),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function exportCustomerLedgerCsv(query) {
  const filter = {};
  if (query.customerId) filter.customer = query.customerId;
  const items = await CustomerLedger.find(filter).populate('customer', 'name').sort({ date: 1 }).limit(5000);
  return toCsv(items, [
    { header: 'Date', value: (r) => r.date?.toISOString?.().slice(0, 10) || '' },
    { header: 'Customer', value: (r) => r.customer?.name || '' },
    { header: 'Type', value: (r) => r.type },
    { header: 'Amount', value: (r) => r.amount },
    { header: 'Balance After', value: (r) => r.balanceAfter },
    { header: 'Description', value: (r) => r.description },
  ]);
}
