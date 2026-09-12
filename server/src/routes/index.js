import { Router } from 'express';
import authRoutes from './auth.routes.js';
import roomRoutes from './room.routes.js';
import fileRoutes from './file.routes.js';
import chatRoutes from './chat.routes.js';
import executionRoutes from './execution.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);
router.use('/files', fileRoutes);
router.use('/chat', chatRoutes);
router.use('/execute', executionRoutes);

export default router;
