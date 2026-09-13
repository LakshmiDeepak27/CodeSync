import { io } from 'socket.io-client';

let socket = null;

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  const isDevVite =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
    (window.location.port === '5175' || window.location.port === '5173');
  return isDevVite ? 'http://localhost:5000' : '/';
};

export const getSocket = () => {
  if (!socket) {
    const socketUrl = getSocketUrl();
    let token = null;
    try {
      token = localStorage.getItem('codesync_token');
    } catch {
      // ignore
    }

    socket = io(socketUrl, {
      withCredentials: true,
      auth: {
        token
      },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
