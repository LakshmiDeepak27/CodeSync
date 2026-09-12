import { api } from './api.js';

export const roomService = {
  async createRoom(data) {
    const res = await api.post('/rooms', data);
    return res.data.room;
  },

  async joinRoom(roomCode) {
    const res = await api.post('/rooms/join', { roomCode });
    return res.data.room;
  },

  async getRoomDetail(roomId) {
    const res = await api.get(`/rooms/${roomId}`);
    return res.data.room;
  },

  async getMyRooms() {
    const res = await api.get('/rooms/my-rooms');
    return res.data.rooms;
  },

  async deleteRoom(roomId) {
    const res = await api.delete(`/rooms/${roomId}`);
    return res.data;
  }
};
