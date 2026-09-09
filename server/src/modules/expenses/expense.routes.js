import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './expense.controller.js';
import { createExpenseSchema, updateExpenseSchema, approveExpenseSchema } from './expense.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('expenses:view'), ctrl.listExpenses);
router.get('/:id', requirePermission('expenses:view'), ctrl.getExpense);
router.post('/', requirePermission('expenses:create'), validate(createExpenseSchema), ctrl.createExpense);
router.patch('/:id', requirePermission('expenses:edit'), validate(updateExpenseSchema), ctrl.updateExpense);
router.post('/:id/approve', requirePermission('expenses:approve'), validate(approveExpenseSchema), ctrl.approveExpense);
router.post('/:id/reject', requirePermission('expenses:approve'), ctrl.rejectExpense);
router.delete('/:id', requirePermission('expenses:edit'), ctrl.deleteExpense);

export default router;
