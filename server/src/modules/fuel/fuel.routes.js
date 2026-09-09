import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './fuel.controller.js';
import { createFuelSchema, updateFuelSchema } from './fuel.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('fuel:view'), ctrl.listFuel);
router.get('/:id', requirePermission('fuel:view'), ctrl.getFuel);
router.post('/', requirePermission('fuel:create'), validate(createFuelSchema), ctrl.createFuel);
router.patch('/:id', requirePermission('fuel:edit'), validate(updateFuelSchema), ctrl.updateFuel);
router.delete('/:id', requirePermission('fuel:edit'), ctrl.deleteFuel);

export default router;
