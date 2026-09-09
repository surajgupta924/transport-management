import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as roleController from './role.controller.js';
import { createRoleSchema, updateRoleSchema } from './role.validation.js';

const router = Router();

router.use(authenticate);

router.get('/permissions', requirePermission('roles:view'), roleController.listPermissions);
router.get('/', requirePermission('roles:view'), roleController.listRoles);
router.get('/:id', requirePermission('roles:view'), roleController.getRole);
router.post('/', requirePermission('roles:manage'), validate(createRoleSchema), roleController.createRole);
router.patch('/:id', requirePermission('roles:manage'), validate(updateRoleSchema), roleController.updateRole);
router.delete('/:id', requirePermission('roles:manage'), roleController.deleteRole);

export default router;
