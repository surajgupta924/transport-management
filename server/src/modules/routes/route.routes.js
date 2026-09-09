import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './route.controller.js';
import { createRouteSchema, updateRouteSchema } from './route.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('trips:view'), ctrl.listRoutes);
router.get('/:id', requirePermission('trips:view'), ctrl.getRoute);
router.post('/', requirePermission('trips:create'), validate(createRouteSchema), ctrl.createRoute);
router.patch('/:id', requirePermission('trips:edit'), validate(updateRouteSchema), ctrl.updateRoute);
router.delete('/:id', requirePermission('trips:edit'), ctrl.deleteRoute);

export default router;
