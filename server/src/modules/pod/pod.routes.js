import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './pod.controller.js';
import { createPodSchema, updatePodSchema, verifyPodSchema } from './pod.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('pod:view'), ctrl.listPods);
router.get('/:id', requirePermission('pod:view'), ctrl.getPod);
router.post('/', requirePermission('pod:create'), validate(createPodSchema), ctrl.createPod);
router.patch('/:id', requirePermission('pod:create'), validate(updatePodSchema), ctrl.updatePod);
router.post('/:id/verify', requirePermission('pod:approve'), validate(verifyPodSchema), ctrl.verifyPod);

export default router;
