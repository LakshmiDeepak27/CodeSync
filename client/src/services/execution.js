import { api } from './api.js';

export const executionService = {
  async executeCode({ roomId, fileId, language = 'cpp', code, sourceCode = code, stdin = '' }) {
    const res = await api.post('/execute', {
      roomId,
      fileId,
      language,
      code,
      sourceCode,
      stdin
    });
    return res.data;
  }
};
