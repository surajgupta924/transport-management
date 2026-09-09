import { Customer } from './customer.model.js';
import { User } from '../users/user.model.js';
import { Role } from '../roles/role.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';

async function assertUniqueContact({ email, mobile, excludeId }) {
  if (email) {
    const q = { email: email.toLowerCase() };
    if (excludeId) q._id = { $ne: excludeId };
    const existing = await Customer.findOne(q);
    if (existing) throw new ApiError(409, 'Customer email already exists', null, 'DUPLICATE_EMAIL');
  }
  if (mobile) {
    const q = { mobile };
    if (excludeId) q._id = { $ne: excludeId };
    const existing = await Customer.findOne(q);
    if (existing) throw new ApiError(409, 'Customer mobile already exists', null, 'DUPLICATE_MOBILE');
  }
}

function mapPayload(payload) {
  const data = { ...payload };
  if (payload.branchId !== undefined) {
    data.branch = payload.branchId || undefined;
    delete data.branchId;
  }
  if (payload.address) {
    data.billingAddress = {
      line1: payload.address.line1,
      line2: payload.address.line2,
      city: payload.address.city,
      state: payload.address.state,
      postalCode: payload.address.pincode || payload.address.postalCode,
      country: payload.address.country || 'India',
    };
    delete data.address;
  }
  if (payload.alternateMobile) {
    const contacts = Array.isArray(data.contacts) ? [...data.contacts] : [];
    contacts.push({ name: 'Alternate', mobile: payload.alternateMobile });
    data.contacts = contacts;
    delete data.alternateMobile;
  }
  if (data.email === '') data.email = undefined;
  if (data.mobile === '') data.mobile = undefined;
  return data;
}

export async function listCustomers(query) {
  const { page, limit, skip, sort, search } = parsePagination(query);
  const filter = {};

  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { company: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { mobile: new RegExp(search, 'i') },
      { gstin: new RegExp(search, 'i') },
    ];
  }
  if (query.status) filter.status = query.status;
  if (query.source) filter.source = query.source;
  if (query.type) filter.type = query.type;
  if (query.tag) filter.tags = query.tag;
  if (query.branchId) filter.branch = query.branchId;

  const [items, total] = await Promise.all([
    Customer.find(filter)
      .populate('branch', 'name code')
      .populate('portalUser', 'name email status')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Customer.countDocuments(filter),
  ]);

  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getCustomerById(id) {
  const customer = await Customer.findById(id)
    .populate('branch', 'name code')
    .populate('portalUser', 'name email status')
    .populate('crmNotes.createdBy', 'name email');
  if (!customer) throw new ApiError(404, 'Customer not found');
  const obj = customer.toObject();
  obj.address = {
    ...(obj.billingAddress || {}),
    pincode: obj.billingAddress?.postalCode,
  };
  obj.notesList = obj.crmNotes || [];
  return obj;
}

export async function createCustomer(payload, actor, req) {
  const data = mapPayload(payload);
  await assertUniqueContact({ email: data.email, mobile: data.mobile });

  const customer = await Customer.create(data);
  await writeAuditLog({
    actor,
    module: 'customers',
    entity: 'Customer',
    entityId: customer._id,
    action: 'CREATE',
    description: `${actor.email} created customer ${customer.name}`,
    newValue: { name: customer.name, source: customer.source },
    req,
  });
  return customer;
}

export async function updateCustomer(id, payload, actor, req) {
  const customer = await Customer.findById(id);
  if (!customer) throw new ApiError(404, 'Customer not found');

  const data = mapPayload(payload);
  await assertUniqueContact({
    email: data.email,
    mobile: data.mobile,
    excludeId: customer._id,
  });

  const oldValue = { name: customer.name, status: customer.status };
  Object.assign(customer, data);
  await customer.save();

  await writeAuditLog({
    actor,
    module: 'customers',
    entity: 'Customer',
    entityId: customer._id,
    action: 'UPDATE',
    description: `${actor.email} updated customer ${customer.name}`,
    oldValue,
    newValue: { name: customer.name, status: customer.status },
    req,
  });
  return customer;
}

export async function deleteCustomer(id, actor, req) {
  const customer = await Customer.findById(id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  await customer.deleteOne();
  await writeAuditLog({
    actor,
    module: 'customers',
    entity: 'Customer',
    entityId: id,
    action: 'DELETE',
    description: `${actor.email} deleted customer ${customer.name}`,
    req,
  });
  return { deleted: true };
}

export async function invitePortal(id, payload, actor, req) {
  const customer = await Customer.findById(id);
  if (!customer) throw new ApiError(404, 'Customer not found');

  const email = payload.email.toLowerCase();
  let user = await User.findOne({ email });
  if (user) throw new ApiError(409, 'A user with this email already exists');

  const role = await Role.findOne({ slug: 'customer' });
  if (!role) throw new ApiError(500, 'Customer role not seeded');

  const password = payload.password || `Cust@${Math.random().toString(36).slice(2, 10)}9`;
  const passwordHash = await User.hashPassword(password);

  user = await User.create({
    name: payload.name || customer.name,
    email,
    mobile: customer.mobile,
    passwordHash,
    role: role._id,
    portalType: 'CUSTOMER',
    status: 'ACTIVE',
    emailVerified: true,
    linkedCustomer: customer._id,
  });

  customer.portalUser = user._id;
  customer.email = customer.email || email;
  customer.invitedAt = new Date();
  await customer.save();

  await writeAuditLog({
    actor,
    module: 'customers',
    entity: 'Customer',
    entityId: customer._id,
    action: 'INVITE',
    description: `${actor.email} invited portal user for ${customer.name}`,
    req,
  });

  return {
    customer,
    portalUser: { id: user._id, email: user.email, temporaryPassword: payload.password ? undefined : password },
  };
}

export async function addCustomerNote(id, { body }, actor, req) {
  const customer = await Customer.findById(id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  customer.crmNotes.push({ body, createdBy: actor._id, createdAt: new Date() });
  await customer.save();
  await writeAuditLog({
    actor,
    module: 'customers',
    entity: 'Customer',
    entityId: customer._id,
    action: 'NOTE',
    description: `${actor.email} added a note on ${customer.name}`,
    req,
  });
  return getCustomerById(id);
}

export async function updateCustomerTags(id, { tags }, actor, req) {
  const customer = await Customer.findById(id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  const oldTags = [...(customer.tags || [])];
  customer.tags = [...new Set((tags || []).map((t) => String(t).trim()).filter(Boolean))];
  await customer.save();
  await writeAuditLog({
    actor,
    module: 'customers',
    entity: 'Customer',
    entityId: customer._id,
    action: 'TAGS',
    description: `${actor.email} updated tags for ${customer.name}`,
    oldValue: oldTags,
    newValue: customer.tags,
    req,
  });
  return getCustomerById(id);
}
