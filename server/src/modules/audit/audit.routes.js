import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import * as ctrl from './audit.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('audit:view'), ctrl.listLogs);

export default router;
