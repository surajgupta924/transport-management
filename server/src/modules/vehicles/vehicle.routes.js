import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './vehicle.controller.js';
import { createVehicleSchema, updateVehicleSchema, vehicleDocumentSchema } from './vehicle.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('vehicles:view'), ctrl.listVehicles);
router.get('/:id', requirePermission('vehicles:view'), ctrl.getVehicle);
router.post('/', requirePermission('vehicles:create'), validate(createVehicleSchema), ctrl.createVehicle);
router.patch('/:id', requirePermission('vehicles:edit'), validate(updateVehicleSchema), ctrl.updateVehicle);
router.delete('/:id', requirePermission('vehicles:delete'), ctrl.deleteVehicle);

router.get('/:id/documents', requirePermission('vehicles:view'), ctrl.listDocuments);
router.post('/:id/documents', requirePermission('vehicles:edit'), validate(vehicleDocumentSchema), ctrl.addDocument);
router.patch('/:id/documents/:docId', requirePermission('vehicles:edit'), validate(vehicleDocumentSchema.partial()), ctrl.updateDocument);
router.delete('/:id/documents/:docId', requirePermission('vehicles:edit'), ctrl.deleteDocument);

export default router;
