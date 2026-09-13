import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { ENV } from '../config/env.js';
import { SOCKET_EVENTS } from '@codesync/shared/events';
import { ChatService } from '../services/chat.service.js';
import { RoomService } from '../services/room.service.js';
import { FileService } from '../services/file.service.js';
import { ROLES } from '@codesync/shared/constants';

// Room presence maps: roomId -> Map(socketId, presenceObject)
const roomPresence = new Map();

// Color palette for collaborator cursors
const COLLABORATOR_COLORS = [
  '#38bdf8', // Sky Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#06b6d4'  // Cyan
];

const getUserColor = (userId) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLLABORATOR_COLORS.length;
  return COLLABORATOR_COLORS[index];
};

export function setupSocketIO(io) {
  // Socket Authentication Middleware
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers.cookie) {
        const parsedCookies = cookie.parse(socket.handshake.headers.cookie);
        token = parsedCookies.token;
      }

      if (!token && socket.handshake.query?.token) {
        token = socket.handshake.query.token;
      }

      if (!token) {
        const guestName = socket.handshake.auth?.username || socket.handshake.query?.username || `Guest_${socket.id.substring(0, 5)}`;
        socket.user = {
          userId: `guest_${socket.id}`,
          username: guestName,
          name: guestName,
          isGuest: true
        };
        return next();
      }

      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      const guestName = socket.handshake.auth?.username || `Guest_${socket.id.substring(0, 5)}`;
      socket.user = {
        userId: `guest_${socket.id}`,
        username: guestName,
        name: guestName,
        isGuest: true
      };
      next();
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    let currentRoomId = null;

    // Join room
    socket.on(SOCKET_EVENTS.ROOM_JOIN, async ({ roomId, fileId }) => {
      try {
        currentRoomId = roomId;
        const roomChannel = `room:${roomId}`;
        socket.join(roomChannel);

        const role = await RoomService.checkUserRoomRole(roomId, user.userId);
        const userColor = getUserColor(user.userId);

        if (!roomPresence.has(roomId)) {
          roomPresence.set(roomId, new Map());
        }

        const presenceInfo = {
          socketId: socket.id,
          userId: user.userId,
          username: user.username,
          name: user.name || user.username,
          color: userColor,
          fileId: fileId || null,
          role: role || ROLES.VIEWER,
          lastActive: Date.now()
        };

        roomPresence.get(roomId).set(socket.id, presenceInfo);

        // Get array of unique online collaborators in this room
        const activeMembers = Array.from(roomPresence.get(roomId).values());

        // Acknowledge joining
        socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
          roomId,
          role: role || ROLES.VIEWER,
          presence: activeMembers
        });

        // Broadcast to others in the room
        socket.to(roomChannel).emit(SOCKET_EVENTS.USER_JOINED, presenceInfo);
        io.to(roomChannel).emit(SOCKET_EVENTS.PRESENCE_SYNC, activeMembers);
      } catch (error) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
      }
    });

    // Cursor position & selection update
    socket.on(SOCKET_EVENTS.CURSOR_UPDATE, ({ roomId, fileId, line, column, selection }) => {
      if (!roomId) return;
      const userColor = getUserColor(user.userId);

      const cursorPayload = {
        userId: user.userId,
        username: user.username,
        name: user.name || user.username,
        color: userColor,
        fileId,
        line,
        column,
        selection,
        lastActive: Date.now()
      };

      // Broadcast to other collaborators in the room
      socket.to(`room:${roomId}`).emit(SOCKET_EVENTS.CURSOR_BROADCAST, cursorPayload);

      // Update presence
      if (roomPresence.has(roomId) && roomPresence.get(roomId).has(socket.id)) {
        const presence = roomPresence.get(roomId).get(socket.id);
        presence.fileId = fileId;
        presence.lastActive = Date.now();
      }
    });

    // Editor operational delta update
    socket.on(SOCKET_EVENTS.EDITOR_OPERATION, async ({ roomId, fileId, version, changes, cursor }) => {
      if (!roomId || !fileId) return;

      try {
        // Enforce role: VIEWERS cannot edit
        const role = await RoomService.checkUserRoomRole(roomId, user.userId);
        if (role === ROLES.VIEWER) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Viewers cannot edit code in this room.' });
          return;
        }

        // Broadcast change operation immediately to other editors
        socket.to(`room:${roomId}`).emit(SOCKET_EVENTS.EDITOR_BROADCAST, {
          fileId,
          version,
          userId: user.userId,
          username: user.username,
          changes
        });

        // Broadcast cursor if supplied
        if (cursor) {
          socket.to(`room:${roomId}`).emit(SOCKET_EVENTS.CURSOR_BROADCAST, {
            userId: user.userId,
            username: user.username,
            name: user.name || user.username,
            color: getUserColor(user.userId),
            fileId,
            line: cursor.line,
            column: cursor.column,
            lastActive: Date.now()
          });
        }
      } catch (error) {
        console.error('Editor operation error:', error);
      }
    });

    // Yjs update distribution
    socket.on(SOCKET_EVENTS.YJS_UPDATE, ({ roomId, fileId, update }) => {
      if (!roomId || !fileId) return;
      socket.to(`room:${roomId}`).emit(SOCKET_EVENTS.YJS_UPDATE, {
        fileId,
        update,
        userId: user.userId
      });
    });

    // Real-time Chat
    socket.on(SOCKET_EVENTS.CHAT_SEND, async ({ roomId, content }) => {
      if (!roomId || !content?.trim()) return;

      try {
        const savedMessage = await ChatService.saveMessage({
          roomId,
          userId: user.userId,
          content: content.trim()
        });

        io.to(`room:${roomId}`).emit(SOCKET_EVENTS.CHAT_MESSAGE, savedMessage);
      } catch (error) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to send chat message' });
      }
    });

    // File events broadcast (created, renamed, deleted)
    socket.on(SOCKET_EVENTS.FILE_CREATED, ({ roomId, file }) => {
      if (roomId) socket.to(`room:${roomId}`).emit(SOCKET_EVENTS.FILE_CREATED, file);
    });

    socket.on(SOCKET_EVENTS.FILE_RENAMED, ({ roomId, file }) => {
      if (roomId) socket.to(`room:${roomId}`).emit(SOCKET_EVENTS.FILE_RENAMED, file);
    });

    // Friend Request Broadcast
    socket.on('friend:request:send', ({ senderUsername, targetUsername, roomId }) => {
      if (roomId) {
        socket.to(`room:${roomId}`).emit('friend:request:received', {
          senderUsername: senderUsername || user.username,
          targetUsername,
          roomId,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle Leave & Disconnect
    const handleLeave = () => {
      if (currentRoomId && roomPresence.has(currentRoomId)) {
        const roomMap = roomPresence.get(currentRoomId);
        roomMap.delete(socket.id);

        const remaining = Array.from(roomMap.values());
        socket.to(`room:${currentRoomId}`).emit(SOCKET_EVENTS.USER_LEFT, {
          userId: user.userId,
          socketId: socket.id
        });
        io.to(`room:${currentRoomId}`).emit(SOCKET_EVENTS.PRESENCE_SYNC, remaining);

        if (roomMap.size === 0) {
          roomPresence.delete(currentRoomId);
        }
      }
    };

    socket.on(SOCKET_EVENTS.ROOM_LEAVE, handleLeave);
    socket.on('disconnect', handleLeave);
  });
}
