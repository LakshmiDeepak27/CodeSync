import { prisma } from './prisma.js';

export class FileService {
  static getLanguageByExtension(fileName) {
    if (fileName.endsWith('.cpp') || fileName.endsWith('.cc') || fileName.endsWith('.cxx')) return 'cpp';
    if (fileName.endsWith('.h') || fileName.endsWith('.hpp')) return 'cpp';
    if (fileName.endsWith('.c')) return 'c';
    if (fileName.endsWith('.py')) return 'python';
    if (fileName.endsWith('.js')) return 'javascript';
    if (fileName.endsWith('.json')) return 'json';
    return 'plaintext';
  }

  static async createFile({ roomId, name, path, content = '' }) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    const existing = await prisma.file.findUnique({
      where: {
        roomId_path: {
          roomId,
          path: normalizedPath
        }
      }
    });

    if (existing) {
      const error = new Error('A file with this path already exists in the room.');
      error.status = 409;
      throw error;
    }

    const language = this.getLanguageByExtension(name);

    return prisma.file.create({
      data: {
        roomId,
        name,
        path: normalizedPath,
        language,
        content,
        version: 1
      }
    });
  }

  static async checkUserFilePermission(fileId, userId) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) {
      const error = new Error('File not found');
      error.status = 404;
      throw error;
    }

    const membership = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId: file.roomId,
          userId
        }
      }
    });

    const room = await prisma.room.findUnique({ where: { id: file.roomId } });
    const isOwner = room && room.ownerId === userId;
    const role = isOwner ? 'OWNER' : membership?.role;

    if (!role || (role !== 'OWNER' && role !== 'EDITOR')) {
      const error = new Error('Permission denied. You must be an owner or editor to modify files.');
      error.status = 403;
      throw error;
    }

    return file;
  }

  static async updateContent(fileId, content, userId) {
    if (userId) {
      await this.checkUserFilePermission(fileId, userId);
    }

    return prisma.file.update({
      where: { id: fileId },
      data: {
        content,
        version: { increment: 1 }
      }
    });
  }

  static async renameFile(fileId, newName, userId) {
    const file = userId
      ? await this.checkUserFilePermission(fileId, userId)
      : await prisma.file.findUnique({ where: { id: fileId } });

    if (!file) {
      const error = new Error('File not found');
      error.status = 404;
      throw error;
    }

    const newPath = `/${newName}`;
    const language = this.getLanguageByExtension(newName);

    return prisma.file.update({
      where: { id: fileId },
      data: {
        name: newName,
        path: newPath,
        language
      }
    });
  }

  static async deleteFile(fileId, roomId, userId) {
    const file = userId
      ? await this.checkUserFilePermission(fileId, userId)
      : await prisma.file.findUnique({ where: { id: fileId } });

    if (!file) {
      const error = new Error('File not found');
      error.status = 404;
      throw error;
    }

    const targetRoomId = roomId || file.roomId;
    const totalFiles = await prisma.file.count({ where: { roomId: targetRoomId } });
    if (totalFiles <= 1) {
      const error = new Error('Cannot delete the only file in the room.');
      error.status = 400;
      throw error;
    }

    await prisma.file.delete({ where: { id: fileId } });
    return true;
  }
}
