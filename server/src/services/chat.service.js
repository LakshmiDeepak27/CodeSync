import { prisma } from './prisma.js';

export class ChatService {
  static async saveMessage({ roomId, userId, content }) {
    return prisma.chatMessage.create({
      data: {
        roomId,
        userId,
        content
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    });
  }

  static async getRoomMessages(roomId, limit = 100) {
    return prisma.chatMessage.findMany({
      where: { roomId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: limit
    });
  }
}
