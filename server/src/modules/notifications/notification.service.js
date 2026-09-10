import { Notification } from './notification.model.js';
import { User } from '../users/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';

let ioRef = null;

export function setNotificationIo(io) {
  ioRef = io;
}

function presentNotification(doc) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj.isRead = Boolean(obj.readAt);
  obj.message = obj.body;
  obj.subject = obj.title;
  return obj;
}

export async function emitNotification(userId, payload) {
  if (!userId) return null;
  const notification = await Notification.create({
    user: userId,
    title: payload.title,
    body: payload.body || '',
    type: payload.type || 'INFO',
    data: payload.data,
    link: payload.link,
  });

  if (ioRef) {
    ioRef.to(`user:${String(userId)}`).emit('notification:new', presentNotification(notification));
  }
  return notification;
}

export async function notifyStaff(payload) {
  const users = await User.find({ portalType: 'STAFF', status: 'ACTIVE' }).select('_id');
  const results = [];
  for (const user of users) {
    results.push(await emitNotification(user._id, payload));
  }
  return results;
}

export async function listNotifications(userId, query) {
  const { page, limit, skip, sort } = parsePagination(query);
  const filter = { user: userId };
  if (query.unread === 'true') filter.readAt = null;
  if (query.type && query.type !== 'ALL') {
    if (query.type === 'INFO') filter.type = { $in: ['INFO', 'BOOKING', 'TRIP', 'SYSTEM'] };
    else if (query.type === 'SUCCESS') filter.type = { $in: ['SUCCESS', 'PAYMENT'] };
    else filter.type = query.type;
  }

  const [items, total, unreadCount, warningCount, successCount] = await Promise.all([
    Notification.find(filter).sort(sort.createdAt ? sort : { createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, readAt: null }),
    Notification.countDocuments({ user: userId, type: 'WARNING' }),
    Notification.countDocuments({ user: userId, type: 'SUCCESS' }),
  ]);

  return {
    items: items.map(presentNotification),
    meta: { ...buildMeta({ page, limit, total }), unreadCount, warningCount, successCount, total },
  };
}

export async function markRead(userId, id) {
  const notification = await Notification.findOne({ _id: id, user: userId });
  if (!notification) throw new ApiError(404, 'Notification not found');
  notification.readAt = new Date();
  await notification.save();
  return presentNotification(notification);
}

export async function markAllRead(userId) {
  await Notification.updateMany({ user: userId, readAt: null }, { $set: { readAt: new Date() } });
  return { updated: true };
}
