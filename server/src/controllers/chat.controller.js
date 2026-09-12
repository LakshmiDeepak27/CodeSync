import { ChatService } from '../services/chat.service.js';

export class ChatController {
  static async getMessages(req, res, next) {
    try {
      const { roomId } = req.params;
      const messages = await ChatService.getRoomMessages(roomId);
      res.status(200).json({
        success: true,
        messages
      });
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req, res, next) {
    try {
      const { roomId, content } = req.body;
      const userId = req.user.userId;

      const message = await ChatService.saveMessage({ roomId, userId, content });
      res.status(201).json({
        success: true,
        message
      });
    } catch (error) {
      next(error);
    }
  }
}
