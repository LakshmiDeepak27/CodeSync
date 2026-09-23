import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.VITE_SERVER_URL) {
    const cleanUrl = import.meta.env.VITE_SERVER_URL.replace(/\/+$/, '');
    return `${cleanUrl}/api`;
  }
  return '/api';
};

export const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach Bearer token if stored (handles cross-origin cookie blocking)
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('codesync_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // LocalStorage might be restricted
  }
  return config;
});

// Response interceptor for centralized error message extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    const enhancedError = new Error(message);
    if (error.response?.data && typeof error.response.data === 'object') {
      Object.assign(enhancedError, error.response.data);
    }
    enhancedError.response = error.response;
    enhancedError.status = error.response?.status;
    return Promise.reject(enhancedError);
  }
);
