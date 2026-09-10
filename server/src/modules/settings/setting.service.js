import { Setting } from './setting.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { writeAuditLog } from '../audit/audit.service.js';

export const PUBLIC_SETTING_KEYS = [
  'company.name',
  'company.logoUrl',
  'company.faviconUrl',
  'company.tagline',
  'company.supportEmail',
  'company.supportPhone',
  'company.gstin',
  'company.pan',
  'company.currency',
  'company.timezone',
  'company.address',
  'company.city',
  'company.state',
  'company.pincode',
  'company.bankName',
  'company.bankAccount',
  'company.ifsc',
  'company.paymentTerms',
];

export async function listPublicSettings() {
  const items = await Setting.find({ key: { $in: PUBLIC_SETTING_KEYS } });
  const map = Object.fromEntries(items.map((s) => [s.key, s.value]));
  return {
    companyName: map['company.name'] || 'SwiftHaul',
    logoUrl: map['company.logoUrl'] || '',
    faviconUrl: map['company.faviconUrl'] || '',
    tagline: map['company.tagline'] || 'Transport Management ERP',
    supportEmail: map['company.supportEmail'] || '',
    supportPhone: map['company.supportPhone'] || '',
    gstin: map['company.gstin'] || '',
    pan: map['company.pan'] || '',
    currency: map['company.currency'] || 'INR',
    timezone: map['company.timezone'] || 'Asia/Kolkata',
    address: map['company.address'] || '',
    city: map['company.city'] || '',
    state: map['company.state'] || '',
    pincode: map['company.pincode'] || '',
    bankName: map['company.bankName'] || '',
    bankAccount: map['company.bankAccount'] || '',
    ifsc: map['company.ifsc'] || '',
    paymentTerms: map['company.paymentTerms'] || 'Due on Receipt',
  };
}

export async function listSettings(query = {}) {
  const filter = {};
  if (query.group) filter.group = query.group;
  const items = await Setting.find(filter).sort({ group: 1, key: 1 });
  return items;
}

export async function getSetting(key) {
  const setting = await Setting.findOne({ key });
  if (!setting) throw new ApiError(404, 'Setting not found');
  return setting;
}

export async function upsertSetting(payload, actor, req) {
  const setting = await Setting.findOneAndUpdate(
    { key: payload.key },
    {
      $set: {
        value: payload.value,
        group: payload.group || 'general',
        description: payload.description || '',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await writeAuditLog({
    actor,
    module: 'settings',
    entity: 'Setting',
    entityId: setting._id,
    action: 'UPSERT',
    description: `${actor.email} updated setting ${payload.key}`,
    newValue: { key: payload.key, value: payload.value },
    req,
  });
  return setting;
}

export async function bulkUpsert(settings, actor, req) {
  const results = [];
  for (const item of settings) {
    results.push(await upsertSetting(item, actor, req));
  }
  return results;
}
