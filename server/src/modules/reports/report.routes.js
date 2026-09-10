import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import * as ctrl from './report.controller.js';

const router = Router();
router.use(authenticate);

router.get('/fleet', requirePermission('reports:view'), ctrl.fleet);
router.get('/drivers', requirePermission('reports:view'), ctrl.driver);
router.get('/operations', requirePermission('reports:view'), ctrl.operations);
router.get('/finance', requirePermission('reports:view'), ctrl.finance);
router.get('/customers', requirePermission('reports:view'), ctrl.customer);
router.get('/bookings', requirePermission('reports:view'), ctrl.operations);
router.get('/trips', requirePermission('reports:view'), ctrl.operations);
router.get('/revenue', requirePermission('reports:view'), ctrl.finance);
router.get('/expenses', requirePermission('reports:view'), ctrl.finance);
router.get('/operations/export', requirePermission('reports:export'), ctrl.exportOperations);
router.get('/business', requirePermission('reports:view'), ctrl.business);
router.get('/bookings/export', requirePermission('reports:export'), ctrl.exportOperations);
router.get('/trips/export', requirePermission('reports:export'), ctrl.exportOperations);
router.get('/revenue/export', requirePermission('reports:export'), ctrl.exportOperations);
router.get('/expenses/export', requirePermission('reports:export'), ctrl.exportOperations);
router.get('/fleet/export', requirePermission('reports:export'), ctrl.exportOperations);
router.get('/customers/export', requirePermission('reports:export'), ctrl.exportOperations);

export default router;
