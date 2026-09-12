import { api } from './api.js';

export const chatService = {
  async getMessages(roomId) {
    const res = await api.get(`/chat/${roomId}`);
    return res.data.messages;
  },

  async getRoomMessages(roomId) {
    const res = await api.get(`/chat/${roomId}`);
    return res.data.messages;
  },

  async sendMessage(roomId, content) {
    const res = await api.post('/chat', { roomId, content });
    return res.data.message;
  }
};
