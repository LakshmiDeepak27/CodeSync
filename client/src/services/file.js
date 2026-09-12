import { api } from './api.js';

export const fileService = {
  async createFile({ roomId, name, path, content }) {
    const res = await api.post('/files', { roomId, name, path, content });
    return res.data.file;
  },

  async updateContent(fileId, content) {
    const res = await api.put(`/files/${fileId}`, { content });
    return res.data.file;
  },

  async renameFile(fileId, name) {
    const res = await api.patch(`/files/${fileId}/rename`, { name });
    return res.data.file;
  },

  async deleteFile(fileId, roomId) {
    const res = await api.delete(`/files/${fileId}?roomId=${roomId}`);
    return res.data;
  }
};
