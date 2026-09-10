import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './hiredVehicle.controller.js';
import {
  createHiredVehicleSchema,
  updateHiredVehicleSchema,
  createHiredTripSchema,
  createHiredPaymentSchema,
} from './hiredVehicle.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('hiredVehicles:view'), ctrl.listHiredVehicles);
router.get('/dashboard', requirePermission('hiredVehicles:view'), ctrl.hiredDashboard);
router.get('/trips', requirePermission('hiredVehicles:view'), ctrl.listHiredTrips);
router.get('/payments', requirePermission('hiredVehicles:view'), ctrl.listHiredPayments);
router.post('/trips', requirePermission('hiredVehicles:create'), validate(createHiredTripSchema), ctrl.createHiredTrip);
router.post(
  '/payments',
  requirePermission('hiredVehicles:create'),
  validate(createHiredPaymentSchema),
  ctrl.createHiredPayment
);
router.get('/:id', requirePermission('hiredVehicles:view'), ctrl.getHiredVehicle);
router.post('/', requirePermission('hiredVehicles:create'), validate(createHiredVehicleSchema), ctrl.createHiredVehicle);
router.patch('/:id', requirePermission('hiredVehicles:edit'), validate(updateHiredVehicleSchema), ctrl.updateHiredVehicle);
router.delete('/:id', requirePermission('hiredVehicles:edit'), ctrl.deleteHiredVehicle);

export default router;
