import { PodRecord } from './pod.model.js';
import { Trip } from '../trips/trip.model.js';
import { Booking } from '../bookings/booking.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';
import { notifyStaff } from '../notifications/notification.service.js';

export async function listPods(query, actor) {
  const { page, limit, skip, sort, search } = parsePagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.tripId) filter.trip = query.tripId;
  if (query.bookingId) filter.booking = query.bookingId;
  if (actor?.portalType === 'DRIVER') {
    filter.uploadedBy = actor._id;
  }
  if (search) {
    filter.$or = [
      { receiverName: new RegExp(search, 'i') },
      { notes: new RegExp(search, 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    PodRecord.find(filter)
      .populate('trip', 'tripNumber status')
      .populate('booking', 'bookingNumber')
      .populate('uploadedBy', 'name email')
      .populate('verifiedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    PodRecord.countDocuments(filter),
  ]);
  const presented = items.map((pod) => {
    const obj = pod.toObject();
    obj.receivedBy = obj.receiverName;
    obj.deliveredAt = obj.receivedAt;
    obj.tripId = obj.trip?._id || obj.trip;
    return obj;
  });
  return { items: presented, meta: buildMeta({ page, limit, total }) };
}

export async function getPodById(id) {
  const pod = await PodRecord.findById(id)
    .populate('trip', 'tripNumber status')
    .populate('booking', 'bookingNumber')
    .populate('uploadedBy', 'name email')
    .populate('verifiedBy', 'name email');
  if (!pod) throw new ApiError(404, 'POD not found');
  return pod;
}

export async function createPod(payload, actor, req) {
  const trip = await Trip.findById(payload.tripId);
  if (!trip) throw new ApiError(400, 'Invalid trip');

  const existing = await PodRecord.findOne({ trip: trip._id, status: { $ne: 'REJECTED' } });
  if (existing) throw new ApiError(409, 'POD already exists for this trip');

  const pod = await PodRecord.create({
    trip: trip._id,
    booking: payload.bookingId || trip.booking,
    receiverName: payload.receiverName || payload.receivedBy,
    receiverPhone: payload.receiverPhone,
    receivedAt: payload.receivedAt || payload.deliveredAt || new Date(),
    photoUrls: payload.photoUrls?.length ? payload.photoUrls : payload.photoUrl ? [payload.photoUrl] : [],
    signatureUrl: payload.signatureUrl,
    notes: payload.notes || payload.remarks || '',
    status: payload.photoUrls?.length || payload.photoUrl || payload.signatureUrl ? 'UPLOADED' : payload.status || 'PENDING',
    uploadedBy: actor._id,
  });

  if (pod.status === 'UPLOADED') {
    const booking = await Booking.findById(pod.booking);
    if (booking && !['COMPLETED', 'CANCELLED'].includes(booking.status)) {
      booking.status = 'POD_UPLOADED';
      await booking.save();
    }
  }

  await writeAuditLog({
    actor,
    module: 'pod',
    entity: 'PodRecord',
    entityId: pod._id,
    action: 'CREATE',
    description: `${actor.email} uploaded POD for trip ${trip.tripNumber}`,
    req,
  });
  return getPodById(pod._id);
}

export async function updatePod(id, payload, actor, req) {
  const pod = await PodRecord.findById(id);
  if (!pod) throw new ApiError(404, 'POD not found');
  if (['VERIFIED'].includes(pod.status)) throw new ApiError(400, 'Cannot edit verified POD');

  if (payload.receiverName !== undefined) pod.receiverName = payload.receiverName;
  if (payload.receiverPhone !== undefined) pod.receiverPhone = payload.receiverPhone;
  if (payload.receivedAt !== undefined) pod.receivedAt = payload.receivedAt;
  if (payload.photoUrls !== undefined) pod.photoUrls = payload.photoUrls;
  if (payload.signatureUrl !== undefined) pod.signatureUrl = payload.signatureUrl;
  if (payload.notes !== undefined) pod.notes = payload.notes;
  if (pod.photoUrls?.length || pod.signatureUrl) pod.status = 'UPLOADED';
  await pod.save();

  await writeAuditLog({
    actor,
    module: 'pod',
    entity: 'PodRecord',
    entityId: pod._id,
    action: 'UPDATE',
    description: `${actor.email} updated POD`,
    req,
  });
  return getPodById(pod._id);
}

export async function verifyPod(id, { status, reason }, actor, req) {
  const pod = await PodRecord.findById(id);
  if (!pod) throw new ApiError(404, 'POD not found');
  if (!['UPLOADED', 'PENDING'].includes(pod.status)) {
    throw new ApiError(400, `Cannot verify POD in ${pod.status} status`);
  }

  pod.status = status;
  pod.verifiedBy = actor._id;
  pod.verifiedAt = new Date();
  if (status === 'REJECTED') pod.rejectionReason = reason || '';
  await pod.save();

  if (status === 'VERIFIED') {
    const booking = await Booking.findById(pod.booking);
    if (booking && ['DELIVERED', 'POD_UPLOADED', 'OUT_FOR_DELIVERY'].includes(booking.status)) {
      booking.status = 'COMPLETED';
      await booking.save();
    }
    const trip = await Trip.findById(pod.trip);
    if (trip && !['COMPLETED', 'CANCELLED'].includes(trip.status)) {
      trip.status = 'COMPLETED';
      trip.assignmentStatus = 'RELEASED';
      trip.releasedAt = new Date();
      trip.locationSharing = false;
      await trip.save();
    }
  }

  await writeAuditLog({
    actor,
    module: 'pod',
    entity: 'PodRecord',
    entityId: pod._id,
    action: status,
    description: `${actor.email} ${status.toLowerCase()} POD`,
    req,
  });
  notifyStaff({
    title: status === 'VERIFIED' ? 'POD verified' : 'POD rejected',
    body:
      status === 'VERIFIED'
        ? 'Proof of delivery was accepted and the shipment was completed.'
        : `POD was rejected${reason ? `: ${reason}` : ''}.`,
    type: status === 'VERIFIED' ? 'SUCCESS' : 'WARNING',
    link: '/app/pod',
  }).catch(() => {});
  return getPodById(pod._id);
}
