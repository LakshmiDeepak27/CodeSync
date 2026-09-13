import { useEffect, useMemo, useState } from 'react';
import * as Y from 'yjs';
import { SocketIOProvider } from 'y-socket.io';

const USER_COLORS = [
  '#38bdf8', '#34d399', '#fbbf24', '#f472b6',
  '#a78bfa', '#2dd4bf', '#fb923c', '#60a5fa'
];

export const getColorForUser = (name = '') => {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = (name || '').charCodeAt(i) + ((hash << 5) - hash);
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

export function useYjs(roomId, username) {
  const ydoc = useMemo(() => new Y.Doc(), [roomId]);
  const yFiles = useMemo(() => ydoc.getMap('files'), [ydoc]);
  const yFolders = useMemo(() => ydoc.getMap('folders'), [ydoc]);
  const [users, setUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState(null);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!username || !roomId) {
      setUsers([]);
      setIsConnected(false);
      setProvider(null);
      return;
    }

    let socketUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
    if (import.meta.env.VITE_SOCKET_URL) {
      socketUrl = import.meta.env.VITE_SOCKET_URL;
    } else if (import.meta.env.VITE_SERVER_URL) {
      socketUrl = import.meta.env.VITE_SERVER_URL;
    } else {
      const isDevVite =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
        (window.location.port === '5175' || window.location.port === '5173');
      socketUrl = isDevVite ? 'http://localhost:5000' : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
    }

    let token = null;
    try {
      token = localStorage.getItem('codesync_token');
    } catch {
      // ignore
    }

    const socketProvider = new SocketIOProvider(
      socketUrl,
      roomId,
      ydoc,
      {
        autoConnect: true,
        auth: { token }
      },
      {
        withCredentials: true,
        transports: ['websocket', 'polling']
      }
    );

    setProvider(socketProvider);

    // Set local awareness user state
    const userColor = getColorForUser(username);
    socketProvider.awareness.setLocalStateField('user', {
      name: username,
      username,
      color: userColor,
      colorLight: userColor + '33'
    });

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    if (socketProvider.socket) {
      socketProvider.socket.on('connect', handleConnect);
      socketProvider.socket.on('disconnect', handleDisconnect);
      setIsConnected(socketProvider.socket.connected);
    }

    // Track user list from awareness with username deduplication
    const updateUsers = () => {
      const states = Array.from(socketProvider.awareness.getStates().values());
      const userMap = new Map();
      states.forEach((state) => {
        if (state?.user?.username) {
          const u = state.user;
          const existing = userMap.get(u.username);
          if (!existing || (!existing.activeFile && u.activeFile)) {
            userMap.set(u.username, u);
          }
        }
      });
      setUsers(Array.from(userMap.values()));
    };

    updateUsers();
    socketProvider.awareness.on('change', updateUsers);

    const handleSync = () => {
      setSynced(true);
    };

    if (socketProvider.synced) {
      handleSync();
    } else {
      socketProvider.on('sync', handleSync);
    }

    const handleBeforeUnload = () => {
      try {
        socketProvider.awareness.setLocalState(null);
      } catch {}
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      try {
        socketProvider.awareness.setLocalState(null);
      } catch {}
      socketProvider.disconnect();
      socketProvider.off('sync', handleSync);
      if (socketProvider.socket) {
        socketProvider.socket.off('connect', handleConnect);
        socketProvider.socket.off('disconnect', handleDisconnect);
      }
      try {
        socketProvider.destroy();
      } catch {}
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setProvider(null);
      setIsConnected(false);
      setSynced(false);
    };
  }, [roomId, username, ydoc]);

  return {
    ydoc,
    yFiles,
    yFolders,
    synced,
    provider,
    users,
    isConnected
  };
}
