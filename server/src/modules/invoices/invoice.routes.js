import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './invoice.controller.js';
import { createInvoiceSchema, updateInvoiceSchema, issueInvoiceSchema } from './invoice.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('invoices:view'), ctrl.listInvoices);
router.get('/:id', requirePermission('invoices:view'), ctrl.getInvoice);
router.get('/:id/pdf', requirePermission('invoices:export'), ctrl.downloadPdf);
router.post('/', requirePermission('invoices:create'), validate(createInvoiceSchema), ctrl.createInvoice);
router.patch('/:id', requirePermission('invoices:edit'), validate(updateInvoiceSchema), ctrl.updateInvoice);
router.post('/:id/issue', requirePermission('invoices:edit'), validate(issueInvoiceSchema), ctrl.issueInvoice);

export default router;
