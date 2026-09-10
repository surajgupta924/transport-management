import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './gps.controller.js';
import { saveGpsSetupSchema, gpsWebhookSchema } from './gps.validation.js';

const router = Router();

router.post('/webhook', validate(gpsWebhookSchema), ctrl.webhook);

router.use(authenticate);
router.get('/setup', requirePermission('gps:view'), ctrl.getSetup);
router.put('/setup', requirePermission('gps:manage'), validate(saveGpsSetupSchema), ctrl.saveSetup);
router.post('/token', requirePermission('gps:manage'), ctrl.generateToken);

export default router;
