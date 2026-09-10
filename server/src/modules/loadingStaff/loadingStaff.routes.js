import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './loadingStaff.controller.js';
import { createLoadingStaffSchema, updateLoadingStaffSchema } from './loadingStaff.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('loadingStaff:view'), ctrl.listLoadingStaff);
router.get('/:id', requirePermission('loadingStaff:view'), ctrl.getLoadingStaff);
router.post('/', requirePermission('loadingStaff:create'), validate(createLoadingStaffSchema), ctrl.createLoadingStaff);
router.patch('/:id', requirePermission('loadingStaff:edit'), validate(updateLoadingStaffSchema), ctrl.updateLoadingStaff);

export default router;
