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
        return res.status(400).json({
          success: false,
          message: 'Room ID is required.'
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      const role = await RoomService.checkUserRoomRole(roomId, userId);

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
