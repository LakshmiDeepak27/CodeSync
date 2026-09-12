import { api } from './api.js';

export const authService = {
  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async login(data) {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  async logout() {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data.user;
  },

  async updateProfile(data) {
    const res = await api.put('/auth/profile', data);
    return res.data;
  },

  async requestPasswordReset(email) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(email, code, newPassword) {
    const res = await api.post('/auth/reset-password', { email, code, newPassword });
    return res.data;
  },

  async verifyEmail(email, code) {
    const res = await api.post('/auth/verify-email', { email, code });
    return res.data;
  },

  getGoogleAuthUrl() {
    return '/api/auth/google';
  }
};
