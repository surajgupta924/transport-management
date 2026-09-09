import { ActivityLog } from './activityLog.model.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';

export async function listAuditLogs(query) {
  const { page, limit, skip, sort, search } = parsePagination(query);
  const filter = {};
  if (query.module) filter.module = query.module;
  if (query.action) filter.action = query.action;
  if (query.entityId) filter.entityId = query.entityId;
  if (query.actorId) filter.actor = query.actorId;
  if (search) {
    filter.$or = [
      { description: new RegExp(search, 'i') },
      { actorEmail: new RegExp(search, 'i') },
      { entity: new RegExp(search, 'i') },
    ];
  }
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  const [items, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('actor', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    ActivityLog.countDocuments(filter),
  ]);

  return { items, meta: buildMeta({ page, limit, total }) };
}
