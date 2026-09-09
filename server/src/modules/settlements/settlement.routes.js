import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './settlement.controller.js';
import { createSettlementSchema, settleSchema } from './settlement.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('expenses:view'), ctrl.listSettlements);
router.get('/driver/:driverId/balance', requirePermission('expenses:view'), ctrl.getDriverBalance);
router.get('/:id', requirePermission('expenses:view'), ctrl.getSettlement);
router.post('/', requirePermission('expenses:approve'), validate(createSettlementSchema), ctrl.createSettlement);
router.post('/:id/settle', requirePermission('expenses:approve'), validate(settleSchema), ctrl.settleSettlement);

export default router;
