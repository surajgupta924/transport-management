import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './setting.controller.js';
import { upsertSettingSchema, bulkUpdateSchema } from './setting.validation.js';

const router = Router();

router.get('/public', ctrl.listPublicSettings);

router.use(authenticate);

router.get('/', requirePermission('settings:view'), ctrl.listSettings);
router.put('/bulk', requirePermission('settings:manage'), validate(bulkUpdateSchema), ctrl.bulkUpsert);
router.put('/', requirePermission('settings:manage'), validate(upsertSettingSchema), ctrl.upsertSetting);
router.get('/:key', requirePermission('settings:view'), ctrl.getSetting);

export default router;
