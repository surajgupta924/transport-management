import { Notification } from './notification.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';

let ioRef = null;

export function setNotificationIo(io) {
  ioRef = io;
}

/**
 * Create notification and optionally emit to socket room user:{id}
 */
export async function emitNotification(userId, payload) {
  const notification = await Notification.create({
    user: userId,
    title: payload.title,
    body: payload.body || '',
    type: payload.type || 'INFO',
    data: payload.data,
    link: payload.link,
  });

  if (ioRef) {
    ioRef.to(`user:${userId}`).emit('notification:new', notification);
  }
  return notification;
}

export async function listNotifications(userId, query) {
  const { page, limit, skip, sort } = parsePagination(query);
  const filter = { user: userId };
  if (query.unread === 'true') filter.readAt = null;
  if (query.type && query.type !== 'ALL') filter.type = query.type;

  const [items, total, unreadCount, warningCount, successCount] = await Promise.all([
    Notification.find(filter).sort(sort).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, readAt: null }),
    Notification.countDocuments({ user: userId, type: 'WARNING' }),
    Notification.countDocuments({ user: userId, type: 'SUCCESS' }),
  ]);

  return { items, meta: { ...buildMeta({ page, limit, total }), unreadCount, warningCount, successCount } };
}

export async function markRead(userId, id) {
  const notification = await Notification.findOne({ _id: id, user: userId });
  if (!notification) throw new ApiError(404, 'Notification not found');
  notification.readAt = new Date();
  await notification.save();
  return notification;
}

export async function markAllRead(userId) {
  await Notification.updateMany({ user: userId, readAt: null }, { $set: { readAt: new Date() } });
  return { updated: true };
}
