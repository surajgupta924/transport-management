import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './customer.controller.js';
import { createCustomerSchema, updateCustomerSchema, invitePortalSchema, customerNoteSchema, customerTagsSchema } from './customer.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('customers:view'), ctrl.listCustomers);
router.get('/:id', requirePermission('customers:view'), ctrl.getCustomer);
router.post('/', requirePermission('customers:create'), validate(createCustomerSchema), ctrl.createCustomer);
router.patch('/:id', requirePermission('customers:edit'), validate(updateCustomerSchema), ctrl.updateCustomer);
router.delete('/:id', requirePermission('customers:delete'), ctrl.deleteCustomer);
router.post('/:id/invite', requirePermission('customers:edit'), validate(invitePortalSchema), ctrl.invitePortal);
router.post('/:id/notes', requirePermission('customers:edit'), validate(customerNoteSchema), ctrl.addNote);
router.put('/:id/tags', requirePermission('customers:edit'), validate(customerTagsSchema), ctrl.updateTags);

export default router;
