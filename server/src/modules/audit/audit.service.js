import { ActivityLog } from './activityLog.model.js';

export async function writeAuditLog({
  actor,
  module,
  entity,
  entityId,
  action,
  description,
  oldValue = null,
  newValue = null,
  req = null,
}) {
  try {
    await ActivityLog.create({
      actor: actor?._id || actor || null,
      actorEmail: actor?.email || null,
      module,
      entity,
      entityId,
      action,
      description,
      oldValue,
      newValue,
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
  } catch (err) {
    console.error('Failed to write audit log', err.message);
  }
}
