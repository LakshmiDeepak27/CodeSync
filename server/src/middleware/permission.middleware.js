import { RoomService } from '../services/room.service.js';

/**
 * Middleware factory to enforce room roles (OWNER, EDITOR, VIEWER)
 * @param {string[]} allowedRoles
 */
export const requireRoomRole = (allowedRoles = ['OWNER', 'EDITOR']) => {
  return async (req, res, next) => {
    try {
      const roomId = req.params.roomId || req.body.roomId;
      const userId = req.user?.userId;

      if (!roomId) {
        // If no roomId is provided, allow authenticated execution (solo playground mode)
        return next();
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      let role = await RoomService.checkUserRoomRole(roomId, userId);

      if (!role) {
        const room = await RoomService.getRoomByCodeOrId(roomId);
        if (room && room.visibility === 'PUBLIC') {
          await RoomService.joinRoom({ roomCodeOrId: room.id, userId }).catch(() => {});
          role = 'EDITOR';
        }
      }

      if (!role) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this room.'
        });
      }

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          success: false,
          message: `Permission denied. Required role: ${allowedRoles.join(' or ')}.`
        });
      }

      req.roomRole = role;
      next();
    } catch (error) {
      next(error);
    }
  };
};
