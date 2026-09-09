import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/tokens.js';
import { User } from '../modules/users/user.model.js';
import { env } from '../config/env.js';
import * as trackingService from '../modules/tracking/tracking.service.js';
import { setNotificationIo } from '../modules/notifications/notification.service.js';

export function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  setNotificationIo(io);

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');
      if (!token) return next(new Error('Authentication required'));

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.sub).select('_id name email portalType status');
      if (!user || user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
        return next(new Error('Unauthorized'));
      }
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = String(socket.user._id);
    socket.join(`user:${userId}`);

    socket.on('join', (payload) => {
      const room = typeof payload === 'string' ? payload : payload?.room;
      if (room) socket.join(room);
    });
    socket.on('leave', (payload) => {
      const room = typeof payload === 'string' ? payload : payload?.room;
      if (room) socket.leave(room);
    });

    socket.on('trip:join', (tripId) => {
      if (tripId) socket.join(`trip:${tripId}`);
    });

    socket.on('trip:leave', (tripId) => {
      if (tripId) socket.leave(`trip:${tripId}`);
    });

    socket.on('branch:join', (branchId) => {
      if (branchId) socket.join(`branch:${branchId}`);
    });

    /**
     * Live GPS update. Service throttles DB history writes (LOCATION_THROTTLE_MS)
     * while still updating trip.lastLocation. Prefer client-side batching on reconnect.
     */
    socket.on('trip:location', async (payload, ack) => {
      try {
        const { tripId, lat, lng, accuracy, speed, heading, timestamp } = payload || {};
        if (!tripId || lat == null || lng == null) {
          ack?.({ success: false, message: 'Invalid payload' });
          return;
        }

        const result = await trackingService.recordLocation(tripId, {
          lat,
          lng,
          accuracy,
          speed,
          heading,
          timestamp,
        });

        io.to(`trip:${tripId}`).emit('trip:location', {
          tripId,
          lat,
          lng,
          speed,
          heading,
          timestamp: timestamp || new Date().toISOString(),
          throttled: result.throttled,
          sharing: true,
        });

        ack?.({ success: true, throttled: result.throttled });
      } catch (err) {
        ack?.({ success: false, message: err.message });
      }
    });

    socket.on('trip:location:batch', async (payload, ack) => {
      try {
        const { tripId, points } = payload || {};
        if (!tripId || !Array.isArray(points)) {
          ack?.({ success: false, message: 'Invalid payload' });
          return;
        }
        const result = await trackingService.recordLocationBatch(tripId, points);
        if (result.lastLocation) {
          io.to(`trip:${tripId}`).emit('trip:location', {
            tripId,
            ...result.lastLocation,
          });
        }
        ack?.({ success: true, inserted: result.inserted });
      } catch (err) {
        ack?.({ success: false, message: err.message });
      }
    });

    socket.on('trip:sharing', async (payload, ack) => {
      try {
        const { tripId, sharing } = payload || {};
        if (!tripId) {
          ack?.({ success: false, message: 'Invalid payload' });
          return;
        }
        const trip = await trackingService.setLocationSharing(tripId, sharing);
        io.to(`trip:${tripId}`).emit('trip:sharing', {
          tripId,
          sharing: trip.locationSharing,
        });
        ack?.({ success: true, sharing: trip.locationSharing });
      } catch (err) {
        ack?.({ success: false, message: err.message });
      }
    });

    socket.on('disconnect', () => {
      // rooms auto-cleaned
    });
  });

  return io;
}
