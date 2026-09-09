import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import * as ctrl from './dashboard.controller.js';

const router = Router();
router.use(authenticate);

router.get('/stats', requirePermission('dashboard:view'), ctrl.getStats);

export default router;
