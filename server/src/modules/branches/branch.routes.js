import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './branch.controller.js';
import { createBranchSchema, updateBranchSchema } from './branch.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('branches:view'), ctrl.listBranches);
router.get('/:id', requirePermission('branches:view'), ctrl.getBranch);
router.post('/', requirePermission('branches:manage'), validate(createBranchSchema), ctrl.createBranch);
router.patch('/:id', requirePermission('branches:manage'), validate(updateBranchSchema), ctrl.updateBranch);
router.delete('/:id', requirePermission('branches:manage'), ctrl.deleteBranch);

export default router;
