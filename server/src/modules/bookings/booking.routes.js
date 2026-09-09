import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './booking.controller.js';
import { createBookingSchema, updateBookingSchema, transitionBookingSchema } from './booking.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('bookings:view'), ctrl.listBookings);
router.get('/:id', requirePermission('bookings:view'), ctrl.getBooking);
router.post('/', requirePermission('bookings:create'), validate(createBookingSchema), ctrl.createBooking);
router.patch('/:id', requirePermission('bookings:edit'), validate(updateBookingSchema), ctrl.updateBooking);
router.post('/:id/status', requirePermission('bookings:approve'), validate(transitionBookingSchema), ctrl.transitionBooking);
router.delete('/:id', requirePermission('bookings:delete'), ctrl.deleteBooking);

export default router;
