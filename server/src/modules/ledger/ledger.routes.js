import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './ledger.controller.js';
import { createLedgerEntrySchema } from './ledger.validation.js';

const router = Router();
router.use(authenticate);

router.get('/customers', requirePermission('ledger:view'), ctrl.listCustomerLedger);
router.get('/customers/:customerId', requirePermission('ledger:view'), ctrl.getCustomerSummary);
router.post('/customers', requirePermission('ledger:view'), validate(createLedgerEntrySchema), ctrl.createAdjustment);
router.get('/vendors', requirePermission('ledger:view'), ctrl.listVendorLedger);
router.get('/export', requirePermission('ledger:export'), ctrl.exportCsv);

export default router;
