import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './maintenance.controller.js';
import { createMaintenanceSchema, updateMaintenanceSchema } from './maintenance.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('maintenance:view'), ctrl.listMaintenance);
router.get('/:id', requirePermission('maintenance:view'), ctrl.getMaintenance);
router.post('/', requirePermission('maintenance:create'), validate(createMaintenanceSchema), ctrl.createMaintenance);
router.patch('/:id', requirePermission('maintenance:edit'), validate(updateMaintenanceSchema), ctrl.updateMaintenance);
router.delete('/:id', requirePermission('maintenance:edit'), ctrl.deleteMaintenance);

export default router;
