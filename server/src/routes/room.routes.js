import { Router } from 'express';
import { RoomController } from '../controllers/room.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createRoomSchema, joinRoomSchema } from '../utils/validation.js';

const router = Router();

router.post('/', requireAuth, validate(createRoomSchema), RoomController.create);
router.post('/join', requireAuth, validate(joinRoomSchema), RoomController.join);
router.get('/my-rooms', requireAuth, RoomController.getMyRooms);
router.get('/:roomId', optionalAuth, RoomController.getDetail);
router.delete('/:roomId', requireAuth, RoomController.delete);

export default router;
