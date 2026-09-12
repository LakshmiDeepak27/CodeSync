import { FileService } from '../services/file.service.js';

export class FileController {
  static async create(req, res, next) {
    try {
      const { roomId, name, path, content } = req.body;
      const file = await FileService.createFile({ roomId, name, path, content });
      res.status(201).json({
        success: true,
        message: 'File created successfully.',
        file
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateContent(req, res, next) {
    try {
      const { fileId } = req.params;
      const { content } = req.body;
      const userId = req.user.userId;
      const file = await FileService.updateContent(fileId, content, userId);
      res.status(200).json({
        success: true,
        file
      });
    } catch (error) {
      next(error);
    }
  }

  static async rename(req, res, next) {
    try {
      const { fileId } = req.params;
      const { name } = req.body;
      const userId = req.user.userId;
      const file = await FileService.renameFile(fileId, name, userId);
      res.status(200).json({
        success: true,
        message: 'File renamed successfully.',
        file
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { fileId } = req.params;
      const { roomId } = req.query;
      const userId = req.user.userId;

      await FileService.deleteFile(fileId, roomId, userId);
      res.status(200).json({
        success: true,
        message: 'File deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  }
}
