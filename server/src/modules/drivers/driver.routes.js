import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './driver.controller.js';
import { createDriverSchema, updateDriverSchema, driverDocumentSchema } from './driver.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('drivers:view'), ctrl.listDrivers);
router.get('/:id', requirePermission('drivers:view'), ctrl.getDriver);
router.post('/', requirePermission('drivers:create'), validate(createDriverSchema), ctrl.createDriver);
router.patch('/:id', requirePermission('drivers:edit'), validate(updateDriverSchema), ctrl.updateDriver);
router.delete('/:id', requirePermission('drivers:delete'), ctrl.deleteDriver);

router.get('/:id/documents', requirePermission('drivers:view'), ctrl.listDocuments);
router.post('/:id/documents', requirePermission('drivers:edit'), validate(driverDocumentSchema), ctrl.addDocument);
router.patch('/:id/documents/:docId', requirePermission('drivers:edit'), validate(driverDocumentSchema.partial()), ctrl.updateDocument);
router.delete('/:id/documents/:docId', requirePermission('drivers:edit'), ctrl.deleteDocument);

export default router;
