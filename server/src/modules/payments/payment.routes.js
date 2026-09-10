import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './payment.controller.js';
import { createPaymentSchema } from './payment.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('payments:view'), ctrl.listPayments);
router.get('/summary', requirePermission('payments:view'), ctrl.paymentSummary);
router.get('/:id', requirePermission('payments:view'), ctrl.getPayment);
router.post('/', requirePermission('payments:create'), validate(createPaymentSchema), ctrl.createPayment);

export default router;
