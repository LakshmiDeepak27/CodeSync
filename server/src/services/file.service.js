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

  static async updateContent(fileId, content) {
    return prisma.file.update({
      where: { id: fileId },
      data: {
        content,
        version: { increment: 1 }
      }
    });
  }

  static async renameFile(fileId, newName) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
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

  static async deleteFile(fileId, roomId) {
    const totalFiles = await prisma.file.count({ where: { roomId } });
    if (totalFiles <= 1) {
      const error = new Error('Cannot delete the only file in the room.');
      error.status = 400;
      throw error;
    }

    await prisma.file.delete({ where: { id: fileId } });
    return true;
  }
}
