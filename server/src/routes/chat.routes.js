import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { chatSchema } from '../utils/validation.js';

const router = Router();

router.get('/:roomId', requireAuth, ChatController.getMessages);
router.post('/', requireAuth, validate(chatSchema), ChatController.sendMessage);

export default router;
