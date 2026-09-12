import { Router } from 'express';
import { ExecutionController } from '../controllers/execution.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRoomRole } from '../middleware/permission.middleware.js';
import { executionRateLimiter } from '../middleware/rateLimiter.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { executionSchema } from '../utils/validation.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  executionRateLimiter,
  validate(executionSchema),
  requireRoomRole(['OWNER', 'EDITOR']),
  ExecutionController.execute
);

export default router;
