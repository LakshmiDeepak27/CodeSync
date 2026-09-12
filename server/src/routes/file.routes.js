import { Router } from 'express';
import { FileController } from '../controllers/file.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRoomRole } from '../middleware/permission.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createFileSchema, updateFileSchema, renameFileSchema } from '../utils/validation.js';

const router = Router();

router.post('/', requireAuth, validate(createFileSchema), requireRoomRole(['OWNER', 'EDITOR']), FileController.create);
router.put('/:fileId', requireAuth, validate(updateFileSchema), FileController.updateContent);
router.patch('/:fileId/rename', requireAuth, validate(renameFileSchema), FileController.rename);
router.delete('/:fileId', requireAuth, FileController.delete);

export default router;
