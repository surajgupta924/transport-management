import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as userController from './user.controller.js';
import { createUserSchema, updateUserSchema } from './user.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('users:view'), userController.listUsers);
router.get('/:id', requirePermission('users:view'), userController.getUser);
router.post('/', requirePermission('users:create'), validate(createUserSchema), userController.createUser);
router.patch('/:id', requirePermission('users:edit'), validate(updateUserSchema), userController.updateUser);

export default router;
