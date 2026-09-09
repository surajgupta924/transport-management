import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './vendor.controller.js';
import { createVendorSchema, updateVendorSchema, vendorTxnSchema } from './vendor.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('vendors:view'), ctrl.listVendors);
router.get('/:id', requirePermission('vendors:view'), ctrl.getVendor);
router.post('/', requirePermission('vendors:create'), validate(createVendorSchema), ctrl.createVendor);
router.patch('/:id', requirePermission('vendors:edit'), validate(updateVendorSchema), ctrl.updateVendor);
router.delete('/:id', requirePermission('vendors:edit'), ctrl.deleteVendor);
router.get('/:id/transactions', requirePermission('vendors:view'), ctrl.listTransactions);
router.post('/:id/transactions', requirePermission('vendors:edit'), validate(vendorTxnSchema), ctrl.addTransaction);

export default router;
