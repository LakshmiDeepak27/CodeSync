import { Router } from 'express';
import { ExecutionController } from '../controllers/execution.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { executionRateLimiter } from '../middleware/rateLimiter.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { executionSchema } from '../utils/validation.js';

const router = Router();

router.post(
  '/',
  optionalAuth,
  executionRateLimiter,
  validate(executionSchema),
  ExecutionController.execute
);

export default router;
