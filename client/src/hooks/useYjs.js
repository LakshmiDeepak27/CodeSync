import { useEffect, useMemo, useState } from 'react';
import * as Y from 'yjs';
import { SocketIOProvider } from 'y-socket.io';

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

    const isDevVite =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
      (window.location.port === '5175' || window.location.port === '5173');
    const socketUrl = isDevVite ? 'http://localhost:5000' : window.location.origin;

    const socketProvider = new SocketIOProvider(socketUrl, roomId, ydoc, {
      autoConnect: true
    });

    setProvider(socketProvider);

    // Set local awareness user state
    socketProvider.awareness.setLocalStateField('user', { username });

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
