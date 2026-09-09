import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './trip.controller.js';
import { createTripSchema, assignTripSchema, updateTripSchema, transitionTripSchema, tripLocationSchema, tripSharingSchema } from './trip.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('trips:view'), ctrl.listTrips);
router.get('/:id', requirePermission('trips:view'), ctrl.getTrip);
router.get('/:id/track', requirePermission('trips:view'), ctrl.getTripTrack);
router.post('/:id/location', requirePermission('trips:edit'), validate(tripLocationSchema), ctrl.postTripLocation);
router.post('/:id/sharing', requirePermission('trips:edit'), validate(tripSharingSchema), ctrl.setTripSharing);
router.post('/', requirePermission('trips:create'), validate(createTripSchema), ctrl.createTrip);
router.post('/:id/assign', requirePermission('trips:assign'), validate(assignTripSchema), ctrl.assignTrip);
router.patch('/:id', requirePermission('trips:edit'), validate(updateTripSchema), ctrl.updateTrip);
router.post('/:id/status', requirePermission('trips:edit'), validate(transitionTripSchema), ctrl.transitionTrip);

export default router;
