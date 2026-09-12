import { api } from './api.js';

export const executionService = {
  async executeCode({ roomId, fileId, language = 'cpp', code, stdin = '' }) {
    const res = await api.post('/execute', {
      roomId,
      fileId,
      language,
      code,
      stdin
    });
    return res.data.result;
  }
};
