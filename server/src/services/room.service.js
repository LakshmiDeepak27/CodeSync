import crypto from 'crypto';
import { prisma } from './prisma.js';
import { ROLES, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '@codesync/shared/constants';

export class RoomService {
  static generateRoomCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  static async createRoom({ name, description, language = DEFAULT_LANGUAGE, visibility = 'PUBLIC', userId }) {
    const roomCode = this.generateRoomCode();
    const langConfig = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.cpp;

    // Use Prisma transaction to ensure Room, Owner Member, and Initial File are created together
    return prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: {
          name,
          description: description || null,
          roomCode,
          visibility,
          ownerId: userId
        }
      });

      // Add owner as OWNER member
      await tx.roomMember.create({
        data: {
          roomId: room.id,
          userId,
          role: ROLES.OWNER
        }
      });

      // Create default starter file
      await tx.file.create({
        data: {
          roomId: room.id,
          name: langConfig.defaultFileName,
          path: `/${langConfig.defaultFileName}`,
          language: langConfig.monacoLanguage,
          content: langConfig.defaultCode,
          version: 1
        }
      });

      return room;
    });
  }

  static async getRoomByCodeOrId(identifier) {
    return prisma.room.findFirst({
      where: {
        OR: [
          { id: identifier },
          { roomCode: identifier.toUpperCase() }
        ]
      },
      include: {
        owner: {
          select: { id: true, name: true, username: true, email: true, avatarUrl: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, username: true, email: true, avatarUrl: true }
            }
          }
        },
        files: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  static async joinRoom({ roomCodeOrId, userId }) {
    const room = await this.getRoomByCodeOrId(roomCodeOrId);
    if (!room) {
      const error = new Error('Room not found. Please verify the room code.');
      error.status = 404;
      throw error;
    }

    // Check if user is already a member
    let membership = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId: room.id,
          userId
        }
      }
    });

    if (!membership) {
      // Add user as EDITOR
      membership = await prisma.roomMember.create({
        data: {
          roomId: room.id,
          userId,
          role: room.ownerId === userId ? ROLES.OWNER : ROLES.EDITOR
        }
      });
    }

    return this.getRoomByCodeOrId(room.id);
  }

  static async getUserRooms(userId) {
    // Rooms owned or where user is a member
    const memberships = await prisma.roomMember.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            owner: {
              select: { id: true, name: true, username: true, avatarUrl: true }
            },
            members: {
              include: {
                user: {
                  select: { id: true, name: true, username: true, avatarUrl: true }
                }
              }
            },
            files: {
              select: { id: true, name: true, language: true }
            }
          }
        }
      },
      orderBy: {
        room: {
          updatedAt: 'desc'
        }
      }
    });

    return memberships.map((m) => ({
      ...m.room,
      myRole: m.role,
      joinedAt: m.joinedAt
    }));
  }

  static async checkUserRoomRole(roomId, userId) {
    const member = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId
        }
      }
    });
    return member ? member.role : null;
  }

  static async deleteRoom(roomId, userId) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      const error = new Error('Room not found');
      error.status = 404;
      throw error;
    }
    if (room.ownerId !== userId) {
      const error = new Error('Only the room owner can delete this room.');
      error.status = 403;
      throw error;
    }

    await prisma.room.delete({ where: { id: roomId } });
    return true;
  }
}
