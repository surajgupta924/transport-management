import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission, requireAnyPermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './support.controller.js';
import { createTicketSchema, updateTicketSchema, messageSchema } from './support.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('support:view'), ctrl.listTickets);
router.get('/:id', requirePermission('support:view'), ctrl.getTicket);
router.post('/', requirePermission('support:create'), validate(createTicketSchema), ctrl.createTicket);
router.patch('/:id', requirePermission('support:manage'), validate(updateTicketSchema), ctrl.updateTicket);
router.post(
  '/:id/messages',
  requireAnyPermission('support:create', 'support:manage'),
  validate(messageSchema),
  ctrl.addMessage
);
router.post(
  '/:id/replies',
  requireAnyPermission('support:create', 'support:manage'),
  validate(messageSchema),
  ctrl.addMessage
);

export default router;
