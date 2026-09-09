import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import * as ctrl from './notification.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('notifications:view'), ctrl.listNotifications);
router.post('/read-all', requirePermission('notifications:view'), ctrl.markAllRead);
router.post('/:id/read', requirePermission('notifications:view'), ctrl.markRead);

export default router;
