import { RoomService } from '../services/room.service.js';

export class RoomController {
  static async create(req, res, next) {
    try {
      const { name, description, language, visibility } = req.body;
      const userId = req.user.userId;

      const room = await RoomService.createRoom({
        name,
        description,
        language,
        visibility,
        userId
      });

      res.status(201).json({
        success: true,
        message: 'Room created successfully.',
        room
      });
    } catch (error) {
      next(error);
    }
  }

  static async join(req, res, next) {
    try {
      const { roomCode } = req.body;
      const userId = req.user.userId;

      const room = await RoomService.joinRoom({
        roomCodeOrId: roomCode,
        userId
      });

      res.status(200).json({
        success: true,
        message: 'Joined room successfully.',
        room
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDetail(req, res, next) {
    try {
      const { roomId } = req.params;
      const userId = req.user?.userId;

      const room = await RoomService.getRoomByCodeOrId(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found.'
        });
      }

      // Check user membership role if authenticated
      let myRole = null;
      if (userId) {
        myRole = await RoomService.checkUserRoomRole(room.id, userId);
      }

      // If room is private, reject non-members
      if (room.visibility === 'PRIVATE' && !myRole) {
        return res.status(403).json({
          success: false,
          message: 'This room is private. You must be an invited member to access it.'
        });
      }

      res.status(200).json({
        success: true,
        room: {
          ...room,
          myRole
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyRooms(req, res, next) {
    try {
      const userId = req.user.userId;
      const rooms = await RoomService.getUserRooms(userId);
      res.status(200).json({
        success: true,
        rooms
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { roomId } = req.params;
      const userId = req.user.userId;

      await RoomService.deleteRoom(roomId, userId);

      res.status(200).json({
        success: true,
        message: 'Room deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  }
}
