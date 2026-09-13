import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor } from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';
import * as Y from 'yjs';
import { useAuth } from '../hooks/useAuth.jsx';
import { useYjs, getColorForUser } from '../hooks/useYjs.js';
import { roomService } from '../services/room.js';
import { executionService } from '../services/execution.js';

import { ResonyxHeader } from '../components/ResonyxHeader.jsx';
import { ResonyxSidebar } from '../components/ResonyxSidebar.jsx';
import { CodeHubOutputTerminal } from '../components/CodeHubOutputTerminal.jsx';
import { ShareRoomModal } from '../components/ShareRoomModal.jsx';
import { ChatDrawer } from '../components/ChatDrawer.jsx';
import { chatService } from '../services/chat.js';
import { connectSocket, getSocket } from '../socket/socket.js';
import { SOCKET_EVENTS } from '@codesync/shared/events';
import { NewItemModal } from '../components/NewItemModal.jsx';

import { X, Code2, Loader2, Plus, Files, Upload, FolderUp, CheckCircle2, Terminal } from 'lucide-react';

const getLanguageFromExtension = (filename = '') => {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'cpp':
    case 'cc':
    case 'cxx':
      return 'cpp';
    case 'c':
      return 'c';
    case 'py':
      return 'python';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    default:
      return 'plaintext';
  }
};

const getFileBadge = (name = '') => {
  const ext = name.split('.').pop().toLowerCase();
  switch (ext) {
    case 'cpp':
    case 'cc':
    case 'cxx':
      return <span className="text-cyan-400 font-bold text-[9px] font-mono bg-cyan-400/10 px-1 py-0.5 rounded leading-none shrink-0">CPP</span>;
    case 'c':
      return <span className="text-sky-400 font-bold text-[9px] font-mono bg-sky-400/10 px-1 py-0.5 rounded leading-none shrink-0">C</span>;
    case 'py':
      return <span className="text-emerald-400 font-bold text-[9px] font-mono bg-emerald-400/10 px-1 py-0.5 rounded leading-none shrink-0">PY</span>;
    case 'js':
    case 'jsx':
      return <span className="text-yellow-400 font-bold text-[9px] font-mono bg-yellow-400/10 px-1 py-0.5 rounded leading-none shrink-0">JS</span>;
    case 'ts':
    case 'tsx':
      return <span className="text-blue-400 font-bold text-[9px] font-mono bg-blue-400/10 px-1 py-0.5 rounded leading-none shrink-0">TS</span>;
    case 'html':
      return <span className="text-orange-400 font-bold text-[9px] font-mono bg-orange-400/10 px-1.5 py-0.5 rounded leading-none shrink-0">HTML</span>;
    case 'css':
      return <span className="text-teal-400 font-bold text-[9px] font-mono bg-teal-400/10 px-1.5 py-0.5 rounded leading-none shrink-0">CSS</span>;
    case 'json':
      return <span className="text-purple-400 font-bold text-[9px] font-mono bg-purple-400/10 px-1.5 py-0.5 rounded leading-none shrink-0">JSON</span>;
    default:
      return <span className="text-slate-400 font-bold text-[9px] font-mono bg-slate-800 px-1.5 py-0.5 rounded leading-none shrink-0">FILE</span>;
  }
};

export const RoomPage = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const editorRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const [monaco, setMonaco] = useState(null);
  const bindingRef = useRef(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const guestUser = useMemo(() => {
    if (user) return null;
    try {
      const stored = localStorage.getItem('codesync_guest_user');
      if (stored) return JSON.parse(stored);
      const rnd = Math.random().toString(36).substring(2, 6);
      const g = { id: `guest_${rnd}`, username: `Guest_${rnd}`, name: `Guest_${rnd}`, isGuest: true };
      localStorage.setItem('codesync_guest_user', JSON.stringify(g));
      return g;
    } catch {
      return { id: 'guest', username: 'Guest', name: 'Guest' };
    }
  }, [user]);

  const currentUser = user || guestUser;
  const username = currentUser?.username || currentUser?.name || 'Coder';

  // Resonyx Yjs collaboration provider
  const { ydoc, yFiles, yFolders, synced, users, isConnected, provider } = useYjs(roomId, username);

  // Track yFiles mutations reactively so RoomPage re-evaluates activeFile and Monaco bindings
  const [filesVersion, setFilesVersion] = useState(0);
  useEffect(() => {
    if (!yFiles) return;
    const handleYFilesChange = () => {
      setFilesVersion((v) => v + 1);
    };
    yFiles.observe(handleYFilesChange);
    return () => {
      yFiles.unobserve(handleYFilesChange);
    };
  }, [yFiles]);

  const [room, setRoom] = useState(null);
  const [activeFile, setActiveFile] = useState('main.cpp');
  const [openFiles, setOpenFiles] = useState(['main.cpp']);
  const [showOutput, setShowOutput] = useState(false);
  const [outputs, setOutputs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Real-time Chat, Sidebar & Cursor state
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [editorFontSize, setEditorFontSize] = useState(() => {
    const saved = Number(localStorage.getItem('codesync-editor-font-size'));
    return saved >= 11 && saved <= 22 ? saved : 14;
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1, pos: 1, lines: 1, chars: 0 });

  // Draggable sidebar & chat widths with local persistence
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('codesync-sidebar-width');
    return saved ? Math.max(160, Math.min(480, parseInt(saved, 10))) : 240;
  });
  const [chatWidth, setChatWidth] = useState(() => {
    const saved = localStorage.getItem('codesync-chat-width');
    return saved ? Math.max(220, Math.min(550, parseInt(saved, 10))) : 320;
  });

  // Modal state for asking File / Folder names (never auto-generate!)
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'file',
    parentPath: ''
  });

  // Brief toast notification (e.g. Save feedback)
  const [toastMessage, setToastMessage] = useState('');

  // Friends & Friend Requests (real-time cross-synced with Dashboard)
  const [friendsList, setFriendsList] = useState(() => {
    try {
      const saved = localStorage.getItem(`codesync-friends-${user?.id || 'guest'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [sentRequests, setSentRequests] = useState(() => {
    try {
      const saved = localStorage.getItem(`codesync-sent-requests-${user?.id || 'guest'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync to localStorage when updated
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`codesync-friends-${user.id}`, JSON.stringify(friendsList));
    }
  }, [friendsList, user?.id]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`codesync-sent-requests-${user.id}`, JSON.stringify(sentRequests));
    }
  }, [sentRequests, user?.id]);

  const handleSendFriendRequest = (targetUsername) => {
    if (!targetUsername) return;
    const cleanHandle = targetUsername.trim().replace(/^@/, '');
    if (!cleanHandle) return;

    if (cleanHandle.toLowerCase() === (username || '').toLowerCase()) {
      setToastMessage('You cannot add yourself as a friend.');
      setTimeout(() => setToastMessage(''), 2500);
      return;
    }

    if (friendsList.some((f) => (f.username || '').toLowerCase() === cleanHandle.toLowerCase())) {
      setToastMessage(`@${cleanHandle} is already your friend!`);
      setTimeout(() => setToastMessage(''), 2500);
      return;
    }

    if (sentRequests.includes(cleanHandle.toLowerCase())) {
      setToastMessage(`Friend request already sent to @${cleanHandle}`);
      setTimeout(() => setToastMessage(''), 2500);
      return;
    }

    // Add to sent requests state & save
    const updatedSent = [...sentRequests, cleanHandle.toLowerCase()];
    setSentRequests(updatedSent);
    if (user?.id) {
      localStorage.setItem(`codesync-sent-requests-${user.id}`, JSON.stringify(updatedSent));
    }

    // Add friend connection
    const newFriend = {
      id: `user_${Date.now()}`,
      name: cleanHandle.charAt(0).toUpperCase() + cleanHandle.slice(1),
      username: cleanHandle.toLowerCase(),
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanHandle)}`,
      status: 'online',
      currentRoom: roomId
    };
    const updatedFriends = [newFriend, ...friendsList.filter((f) => (f.username || '').toLowerCase() !== cleanHandle.toLowerCase())];
    setFriendsList(updatedFriends);
    if (user?.id) {
      localStorage.setItem(`codesync-friends-${user.id}`, JSON.stringify(updatedFriends));
    }

    // Show feedback toast
    setToastMessage(`Friend request sent to @${cleanHandle}!`);
    setTimeout(() => setToastMessage(''), 3000);

    // Also notify target peer if socket is active
    try {
      const socket = getSocket();
      if (socket) {
        socket.emit('friend:request:send', {
          senderUsername: username,
          targetUsername: cleanHandle,
          roomId
        });
      }
    } catch {}
  };

  // Theme state: defaults to Notepad light style
  const [theme, setTheme] = useState(() => localStorage.getItem('codesync-theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('codesync-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('codesync-theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Real-time Room Chat Integration (Socket.IO + MySQL persistence)
  useEffect(() => {
    if (!roomId) return;

    chatService
      .getRoomMessages(roomId)
      .then((msgs) => {
        if (Array.isArray(msgs)) setMessages(msgs);
      })
      .catch(() => {});

    const socket = connectSocket();
    const joinRoom = () => {
      socket.emit(SOCKET_EVENTS.ROOM_JOIN, { roomId });
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.on('connect', joinRoom);
    }

    const handleChatMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      setUnreadCount((prev) => (showChat ? 0 : prev + 1));
    };

    const handleFriendRequestReceived = (data) => {
      if (data?.targetUsername && data.targetUsername.toLowerCase() === (username || '').toLowerCase()) {
        const sender = data.senderUsername;
        setToastMessage(`@${sender} sent you a friend request!`);
        setTimeout(() => setToastMessage(''), 4000);

        if (user?.id) {
          try {
            const reqKey = `codesync-requests-${user.id}`;
            const existing = JSON.parse(localStorage.getItem(reqKey) || '[]');
            if (!existing.some((r) => (r.username || '').toLowerCase() === (sender || '').toLowerCase())) {
              const newReq = {
                id: `req_${Date.now()}`,
                name: sender.charAt(0).toUpperCase() + sender.slice(1),
                username: sender.toLowerCase(),
                avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(sender)}`,
                date: 'Just now'
              };
              localStorage.setItem(reqKey, JSON.stringify([newReq, ...existing]));
            }
          } catch {}
        }
      }
    };

    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, handleChatMessage);
    socket.on('friend:request:received', handleFriendRequestReceived);

    return () => {
      socket.off('connect', joinRoom);
      socket.off(SOCKET_EVENTS.CHAT_MESSAGE, handleChatMessage);
      socket.off('friend:request:received', handleFriendRequestReceived);
    };
  }, [roomId, showChat, username, user?.id]);

  const handleSendMessage = async (content) => {
    if (!content.trim()) return;
    try {
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit(SOCKET_EVENTS.CHAT_SEND, { roomId, content: content.trim() });
      } else {
        const saved = await chatService.sendMessage(roomId, content.trim());
        setMessages((prev) => [...prev, saved]);
      }
    } catch (err) {
      console.error('Failed to send chat message:', err);
    }
  };

  // Chat toggles strictly on the RIGHT side
  const handleToggleChat = () => {
    setShowChat((prev) => {
      const next = !prev;
      if (next) setUnreadCount(0);
      return next;
    });
  };

  // Modal Open Handlers (Always ask name, never auto-generate!)
  const handleOpenNewFileModal = (parentPath = '') => {
    setModalState({ isOpen: true, type: 'file', parentPath });
  };

  const handleOpenNewFolderModal = (parentPath = '') => {
    setModalState({ isOpen: true, type: 'folder', parentPath });
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCreateModalItem = (name, type, parentPath) => {
    const fullPath = parentPath ? `${parentPath}/${name}` : name;
    if (type === 'file') {
      if (yFiles) {
        const ext = name.split('.').pop().toLowerCase();
        let starter = `// ${name}\n`;
        if (ext === 'cpp') {
          starter = `#include <iostream>\n\nint main() {\n    std::cout << "Hello, ${name}!" << std::endl;\n    return 0;\n}\n`;
        } else if (ext === 'c') {
          starter = `#include <stdio.h>\n\nint main() {\n    printf("Hello, ${name}!\\n");\n    return 0;\n}\n`;
        } else if (ext === 'py') {
          starter = `def main():\n    print("Hello, ${name}!")\n\nif __name__ == "__main__":\n    main()\n`;
        } else if (ext === 'js') {
          starter = `console.log("Hello, ${name}!");\n`;
        } else if (ext === 'html') {
          starter = `<!DOCTYPE html>\n<html>\n<head>\n  <title>${name}</title>\n</head>\n<body>\n  <h1>${name}</h1>\n</body>\n</html>\n`;
        }
        const newText = new Y.Text();
        newText.insert(0, starter);
        yFiles.set(fullPath, newText);
        handleSelectFile(fullPath);
      }
    } else {
      if (yFolders) {
        yFolders.set(fullPath, true);
      }
    }
  };

  // Upload file handling ("only file is enough")
  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleTriggerFolderUpload = () => {
    folderInputRef.current?.click();
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !yFiles) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const path = file.webkitRelativePath || file.name;
        const newText = new Y.Text();
        newText.insert(0, event.target.result || '');
        yFiles.set(path, newText);
        if (files.length === 1) handleSelectFile(path);
      };
      reader.readAsText(file);
    });
    showToastNotification(files.length === 1 ? `Uploaded "${files[0].name}" successfully!` : `Uploaded ${files.length} files successfully!`);
    e.target.value = '';
  };

  // Draggable Divider Handlers for Smooth Resizing
  const handleMouseDownSidebarResize = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (moveEvent) => {
      // Activity bar is 44px
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.min(Math.max(startWidth + delta, 160), 480);
      setSidebarWidth(newWidth);
      localStorage.setItem('codesync-sidebar-width', newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleMouseDownChatResize = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = chatWidth;

    const onMouseMove = (moveEvent) => {
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.min(Math.max(startWidth + delta, 220), 550);
      setChatWidth(newWidth);
      localStorage.setItem('codesync-chat-width', newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const showToastNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2800);
  };

  const handleSaveFile = () => {
    showToastNotification('All changes saved to cloud in real-time!');
  };

  const handleCloseActiveFile = () => {
    if (activeFile) {
      const nextOpen = openFiles.filter((f) => f !== activeFile);
      setOpenFiles(nextOpen);
      if (nextOpen.length > 0) {
        handleSelectFile(nextOpen[nextOpen.length - 1]);
      } else {
        const allKeys = Array.from(yFiles?.keys() || []);
        if (allKeys.length > 0) {
          handleSelectFile(allKeys[0]);
        }
      }
    }
  };

  // Keyboard Shortcuts (Ctrl+N, Ctrl+O, Ctrl+S, Ctrl+B)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (!isCtrlOrCmd) return;

      if (e.key.toLowerCase() === 'n' && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        handleOpenNewFileModal();
      } else if (e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleTriggerUpload();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveFile();
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setShowSidebar((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Undo & Redo Handlers for Notepad++ toolbar
  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('toolbar', 'undo', null);
      editorRef.current.focus();
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('toolbar', 'redo', null);
      editorRef.current.focus();
    }
  };

  // Fetch Room Metadata
  useEffect(() => {
    let isMounted = true;
    roomService
      .getRoomDetail(roomId)
      .then((data) => {
        if (isMounted) setRoom(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [roomId]);

  // Ensure active file is valid and only seed default file if room is truly empty after network sync
  useEffect(() => {
    if (!yFiles) return;

    if (yFiles.size > 0) {
      const keys = Array.from(yFiles.keys());
      if (!yFiles.has(activeFile)) {
        setActiveFile(keys[0]);
        setOpenFiles((prev) => (prev.includes(keys[0]) ? prev : [keys[0], ...prev]));
      }
    } else if (synced && yFiles.size === 0) {
      const timer = setTimeout(() => {
        if (yFiles && yFiles.size === 0) {
          if (room?.files && room.files.length > 0) {
            room.files.forEach((f) => {
              if (!yFiles.has(f.name)) {
                const text = new Y.Text();
                text.insert(0, f.content || '');
                yFiles.set(f.name, text);
              }
            });
            const first = room.files[0].name;
            setActiveFile(first);
            setOpenFiles([first]);
          } else {
            if (!yFiles.has('main.cpp')) {
              const defaultText = new Y.Text();
              defaultText.insert(
                0,
                '#include <iostream>\n\nint main() {\n    std::cout << "Hello, CodeSync!" << std::endl;\n    return 0;\n}\n'
              );
              yFiles.set('main.cpp', defaultText);
            }
            setActiveFile('main.cpp');
            setOpenFiles(['main.cpp']);
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [synced, yFiles, room, filesVersion, activeFile]);

  // Monaco mount handler
  const handleMount = (editorInstance, monacoInstance) => {
    editorRef.current = editorInstance;
    setEditor(editorInstance);
    setMonaco(monacoInstance);

    monacoInstance.editor.defineTheme('notepad-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '008000', fontStyle: 'italic' },
        { token: 'keyword', foreground: '0000ff', fontStyle: 'bold' },
        { token: 'string', foreground: '808080' },
        { token: 'number', foreground: 'ff8000' }
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#000000',
        'editor.lineHighlightBackground': '#e8eef8',
        'editorLineNumber.foreground': '#808080',
        'editorLineNumber.activeForeground': '#000000',
        'editorGutter.background': '#ffffff',
        'editorCursor.foreground': '#000000',
        'editor.selectionBackground': '#b4d7ff'
      }
    });

    monacoInstance.editor.defineTheme('notepad-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e2227',
        'editor.lineHighlightBackground': '#282c34',
        'editorGutter.background': '#1e2227'
      }
    });

    monacoInstance.editor.setTheme(theme === 'dark' ? 'notepad-dark' : 'notepad-light');

    const updatePosition = (e) => {
      const pos = e?.position || editorInstance.getPosition();
      if (pos) {
        const model = editorInstance.getModel();
        const posOffset = model ? model.getOffsetAt(pos) + 1 : 1;
        setCursorPos({
          line: pos.lineNumber,
          col: pos.column,
          pos: posOffset,
          lines: model ? model.getLineCount() : 1,
          chars: model ? model.getValueLength() : 0
        });

        // Broadcast awareness selection immediately for Monaco collaborator cursor
        if (provider?.awareness && model) {
          try {
            const yText = yFiles?.get(activeFile);
            if (yText) {
              const sel = editorInstance.getSelection();
              const startPos = sel ? sel.getStartPosition() : pos;
              const endPos = sel ? sel.getEndPosition() : pos;
              const anchor = model.getOffsetAt(startPos);
              const head = model.getOffsetAt(endPos);
              provider.awareness.setLocalStateField('selection', {
                anchor: Y.createRelativePositionFromTypeIndex(yText, anchor),
                head: Y.createRelativePositionFromTypeIndex(yText, head)
              });
            }
          } catch {}
        }

        // Broadcast cursor position via main socket as well
        try {
          const s = getSocket();
          if (s && s.connected) {
            s.emit(SOCKET_EVENTS.CURSOR_UPDATE, {
              roomId,
              fileId: activeFile,
              line: pos.lineNumber,
              column: pos.column
            });
          }
        } catch {}
      }
    };

    editorInstance.onDidChangeCursorPosition(updatePosition);
    editorInstance.onDidChangeModelContent(() => {
      const model = editorInstance.getModel();
      if (model) {
        setCursorPos((prev) => ({
          ...prev,
          lines: model.getLineCount(),
          chars: model.getValueLength()
        }));
      }
    });

    // Initial position trigger
    updatePosition();

    // Ctrl+Enter / Cmd+Enter run shortcut
    editorInstance.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter, () => {
      handleRunCode();
    });
  };

  // Reactively update theme
  useEffect(() => {
    if (monaco) {
      monaco.editor.setTheme(theme === 'dark' ? 'notepad-dark' : 'notepad-light');
    }
  }, [theme, monaco]);



  // Inject dynamic styles for collaborator cursors and name badges
  useEffect(() => {
    if (!provider?.awareness) return;

    const updateCursorStyles = () => {
      const styleId = 'yjs-collaborator-cursor-styles';
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }

      let css = '';
      provider.awareness.getStates().forEach((state, clientID) => {
        if (state?.user) {
          const col = state.user.color || '#38bdf8';
          const name = (state.user.username || state.user.name || 'Collaborator').replace(/"/g, '\\"');
          css += `
            .yRemoteSelection-${clientID} {
              background-color: ${col}33 !important;
            }
            .yRemoteSelectionHead-${clientID} {
              border-left-color: ${col} !important;
              background-color: ${col} !important;
            }
            .yRemoteSelectionHead-${clientID}::before {
              content: "${name}" !important;
              background-color: ${col} !important;
              color: #ffffff !important;
            }
            .yRemoteSelectionHead-${clientID}::after {
              background-color: ${col} !important;
            }
          `;
        }
      });
      styleEl.textContent = css;
    };

    provider.awareness.on('change', updateCursorStyles);
    updateCursorStyles();

    return () => {
      provider.awareness.off('change', updateCursorStyles);
    };
  }, [provider]);

  // Handle active file change and Monaco model/binding sync
  useEffect(() => {
    if (!editor || !monaco || !activeFile || !yFiles) return;

    let yText = yFiles.get(activeFile);
    if (!yText) {
      const keys = Array.from(yFiles.keys());
      if (keys.length > 0 && !yFiles.has(activeFile)) {
        setActiveFile(keys[0]);
        return;
      }
      if (synced && yFiles.size === 0) {
        yText = new Y.Text(
          '#include <iostream>\n\nint main() {\n    std::cout << "Hello, CodeSync!" << std::endl;\n    return 0;\n}\n'
        );
        yFiles.set(activeFile, yText);
      } else {
        return;
      }
    }

    // Clean up previous binding
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    const uri = monaco.Uri.file(activeFile);
    let model = monaco.editor.getModel(uri);

    if (!model) {
      const lang = getLanguageFromExtension(activeFile);
      model = monaco.editor.createModel(yText.toString(), lang, uri);
    } else {
      if (model.getValue() !== yText.toString()) {
        model.setValue(yText.toString());
      }
    }

    editor.setModel(model);

    // Bind Yjs to the model with awareness for remote collaborator cursors
    const binding = new MonacoBinding(
      yText,
      model,
      new Set([editor]),
      provider?.awareness
    );
    bindingRef.current = binding;

    // Update local awareness about what file we are currently editing and cursor position
    if (provider?.awareness) {
      const userCol = getColorForUser(username);
      provider.awareness.setLocalStateField('user', {
        name: username,
        username,
        activeFile,
        color: userCol,
        colorLight: userCol + '33'
      });

      const sel = editor.getSelection();
      if (sel) {
        const anchor = model.getOffsetAt(sel.getStartPosition());
        const head = model.getOffsetAt(sel.getEndPosition());
        provider.awareness.setLocalStateField('selection', {
          anchor: Y.createRelativePositionFromTypeIndex(yText, anchor),
          head: Y.createRelativePositionFromTypeIndex(yText, head)
        });
      }
    }

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [editor, monaco, activeFile, synced, yFiles, provider, username, filesVersion]);

  // Handle model cleanup on file deletion
  useEffect(() => {
    if (!monaco || !synced) return;

    const handleObserve = (event) => {
      event.keysChanged.forEach((key) => {
        if (!yFiles.has(key)) {
          const uri = monaco.Uri.file(key);
          const model = monaco.editor.getModel(uri);
          if (model) {
            model.dispose();
          }
          if (activeFile === key) {
            const keys = Array.from(yFiles.keys());
            if (keys.length > 0) {
              handleSelectFile(keys[0]);
            } else {
              handleSelectFile('main.cpp');
            }
          }
        }
      });
    };

    yFiles.observe(handleObserve);
    return () => {
      yFiles.unobserve(handleObserve);
    };
  }, [monaco, synced, yFiles, activeFile]);

  // Select a file
  const handleSelectFile = (filename) => {
    setActiveFile(filename);
    if (!openFiles.includes(filename)) {
      setOpenFiles((prev) => [...prev, filename]);
    }

    if (provider?.awareness) {
      provider.awareness.setLocalStateField('user', {
        username,
        activeFile: filename
      });
    }
  };

  // Close tab
  const handleCloseTab = (filename, e) => {
    e.stopPropagation();
    const nextOpen = openFiles.filter((f) => f !== filename);
    setOpenFiles(nextOpen);

    if (activeFile === filename) {
      if (nextOpen.length > 0) {
        handleSelectFile(nextOpen[nextOpen.length - 1]);
      } else {
        const allKeys = Array.from(yFiles.keys());
        if (allKeys.length > 0) {
          handleSelectFile(allKeys[0]);
        }
      }
    }
  };

  // Terminal state matching CodeHub
  const [terminalOutput, setTerminalOutput] = useState('');
  const [terminalError, setTerminalError] = useState('');
  const [execMeta, setExecMeta] = useState(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [stdin, setStdin] = useState('');

  const updateEditorFontSize = (delta) => setEditorFontSize((current) => {
    const next = Math.max(11, Math.min(22, current + delta));
    localStorage.setItem('codesync-editor-font-size', String(next));
    return next;
  });

  // Handle language change from selector
  const handleLanguageChange = (langId) => {
    const extMap = {
      cpp: 'main.cpp',
      c: 'main.c',
      python: 'main.py',
      javascript: 'index.js'
    };
    const targetFile = extMap[langId] || `main.${langId}`;

    if (yFiles && yFiles.has(targetFile)) {
      handleSelectFile(targetFile);
      return;
    }

    const starters = {
      cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, CodeSync!" << std::endl;\n    return 0;\n}\n',
      c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, CodeSync!\\n");\n    return 0;\n}\n',
      python: 'def main():\n    print("Hello, CodeSync!")\n\nif __name__ == "__main__":\n    main()\n',
      javascript: 'console.log("Hello, CodeSync!");\n'
    };

    if (yFiles) {
      const newText = new Y.Text();
      newText.insert(0, starters[langId] || '// Starter code\n');
      yFiles.set(targetFile, newText);
      handleSelectFile(targetFile);
    }
  };

  // Execute Code with Judge0 Engine (CodeHub style)
  const handleRunCode = async () => {
    if (isRunning) return;

    let code = '';
    if (editorRef.current) {
      code = editorRef.current.getValue();
    } else if (yFiles && yFiles.has(activeFile)) {
      code = yFiles.get(activeFile).toString();
    }

    if (!code || !code.trim()) {
      setTerminalError('No code to execute. Write some code first!');
      setShowTerminal(true);
      return;
    }

    try {
      setIsRunning(true);
      setShowTerminal(true);
      setTerminalOutput('');
      setTerminalError('');
      setExecMeta(null);

      const lang = getLanguageFromExtension(activeFile);

      const data = await executionService.executeCode({
        roomId,
        language: lang,
        code,
        stdin
      });

      setExecMeta({
        language: lang.toUpperCase(),
        exitCode: data.exitCode,
        time: data.time || (data.result?.executionTime ? String(data.result.executionTime) : null),
        memory: data.memory || data.result?.memoryUsed || null
      });

      if (data.stderr && !data.stdout) {
        setTerminalError(data.stderr);
        setTerminalOutput('');
      } else if (data.stderr && data.stdout) {
        setTerminalOutput(data.stdout);
        setTerminalError(data.stderr);
      } else if (data.stdout) {
        setTerminalOutput(data.stdout);
        setTerminalError('');
      } else {
        setTerminalOutput('Program finished with no output.');
        setTerminalError('');
      }
    } catch (err) {
      console.error('[Code Execution Error]:', err);
      setTerminalError(err.message || 'Execution failed. Check connection to Judge0 service.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-white dark:bg-[#181a1f] text-slate-800 dark:text-slate-100 overflow-hidden select-none font-sans relative">
      {/* 1. Notepad++ Toolbar Header & Desktop Menu */}
      <ResonyxHeader
        language={getLanguageFromExtension(activeFile)}
        onLanguageChange={handleLanguageChange}
        onRun={handleRunCode}
        isRunning={isRunning}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onNewFile={() => handleOpenNewFileModal('')}
        onNewFolder={() => handleOpenNewFolderModal('')}
        onUploadFile={handleTriggerUpload}
        onSaveFile={handleSaveFile}
        onCloseActiveFile={handleCloseActiveFile}
        onToggleTerminal={() => setShowTerminal((p) => !p)}
        showTerminal={showTerminal}
        onFontDecrease={() => updateEditorFontSize(-1)}
        onFontIncrease={() => updateEditorFontSize(1)}
        fontSize={editorFontSize}
        onLogout={() => navigate('/dashboard')}
        isConnected={isConnected}
        theme={theme}
        onToggleTheme={toggleTheme}
        roomTitle={room?.name || 'Workspace'}
        activeFile={activeFile}
        users={users}
        onShare={() => setIsShareModalOpen(true)}
        onToggleChat={handleToggleChat}
        showChat={showChat}
        unreadCount={unreadCount}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-[#f4f4f4] dark:bg-[#14161b]">
        {/* Left Activity Bar with Files Explorer Icon and Terminal Icon */}
        <aside className="relative w-14 bg-[#eceef1] dark:bg-[#181a1f] border-r border-[#d4d4d4] dark:border-slate-800 flex flex-col items-center py-3 gap-2.5 shrink-0 z-30 select-none">
          <button
            onClick={() => setShowSidebar((prev) => !prev)}
            title="Files Explorer (Click to toggle)"
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              showSidebar
                ? 'bg-white dark:bg-[#282c34] text-blue-600 dark:text-cyan-400 shadow-sm border-l-2 border-l-blue-600 dark:border-l-cyan-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-[#d8dde3]/80 dark:hover:bg-[#282c34]/80 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Files className="w-5.5 h-5.5" />
          </button>

          <button
            onClick={() => setShowTerminal((prev) => !prev)}
            title="Output Terminal (Click to toggle)"
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              showTerminal
                ? 'bg-white dark:bg-[#282c34] text-blue-600 dark:text-cyan-400 shadow-sm border-l-2 border-l-blue-600 dark:border-l-cyan-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-[#d8dde3]/80 dark:hover:bg-[#282c34]/80 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Terminal className="w-5.5 h-5.5" />
          </button>
          <span className="my-0.5 h-px w-7 bg-slate-300 dark:bg-slate-700" />
          <button onClick={handleTriggerUpload} title="Upload file" className="w-9 h-9 rounded-md text-slate-500 hover:bg-slate-200 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-cyan-300"><Upload className="mx-auto w-4.5 h-4.5" /></button>
          <button onClick={handleTriggerFolderUpload} title="Upload folder" className="w-9 h-9 rounded-md text-slate-500 hover:bg-slate-200 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-cyan-300"><FolderUp className="mx-auto w-4.5 h-4.5" /></button>
        </aside>

        {/* Workspace Folder Explorer (Left Sidebar) */}
        {showSidebar && (
          <ResonyxSidebar
            users={users}
            currentUser={username}
            yFiles={yFiles}
            yFolders={yFolders}
            activeFile={activeFile}
            onSelectFile={handleSelectFile}
            roomTitle={room?.name}
            width={sidebarWidth}
            onUploadFile={handleTriggerUpload}
            onUploadFolder={handleTriggerFolderUpload}
            onPromptNewFile={handleOpenNewFileModal}
            onPromptNewFolder={handleOpenNewFolderModal}
            friendsList={friendsList}
            sentRequests={sentRequests}
            onSendFriendRequest={handleSendFriendRequest}
          />
        )}

        {/* Draggable Divider for Left Sidebar */}
        {showSidebar && (
          <div
            onMouseDown={handleMouseDownSidebarResize}
            className="w-1.5 hover:w-2 bg-[#d8d8d8]/80 dark:bg-slate-800 hover:bg-blue-500 active:bg-blue-600 cursor-col-resize select-none shrink-0 transition-all z-20"
            title="Drag to resize directory"
          />
        )}

        {/* Center: Tabs, Editor, Terminal, Status Bar */}
        <div className="flex-1 flex min-w-0 overflow-hidden relative">
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-white dark:bg-[#1e2227]">
            {/* Notepad++ Style Tab Strip */}
            <div className="h-8 bg-[#e8e8e8] dark:bg-[#181a1f] border-b border-[#c8c8c8] dark:border-slate-800 flex items-center px-1 overflow-x-auto shrink-0 scrollbar-none gap-0.5">
              {openFiles.map((filename) => {
                const isActive = filename === activeFile;

                return (
                  <div
                    key={filename}
                    onClick={() => handleSelectFile(filename)}
                    className={`group flex items-center gap-1.5 px-2.5 py-1 text-xs font-sans cursor-pointer transition select-none rounded-t ${
                      isActive
                        ? 'bg-white dark:bg-[#1e2227] text-slate-900 dark:text-slate-100 font-semibold border-t-2 border-t-[#e8a838] border-x border-[#c8c8c8] dark:border-slate-700 shadow-xs'
                        : 'bg-[#dcdcdc] dark:bg-[#21252b] text-slate-700 dark:text-slate-400 hover:bg-[#e2e2e2] dark:hover:bg-[#282c34] border-t-2 border-t-transparent border-x border-[#c8c8c8]/60 dark:border-slate-800'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#e11d48] text-white flex items-center justify-center text-[7px] font-bold">
                      💾
                    </span>
                    <span className="truncate max-w-[150px] font-mono text-[11px]">{filename}</span>
                    {openFiles.length > 1 && (
                      <button
                        onClick={(e) => handleCloseTab(filename, e)}
                        className="ml-1 p-0.5 rounded hover:bg-rose-500 hover:text-white text-slate-400 dark:text-slate-500 transition"
                        title="Close"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Quick '+' button to prompt user for new file name */}
              <button
                onClick={() => handleOpenNewFileModal('')}
                title="New File (asks name)"
                className="p-1 ml-0.5 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded transition"
              >
                <Plus className="w-3 h-3" />
              </button>
              <div className="ml-auto mr-1 hidden items-center overflow-hidden rounded border border-[#cbd2da] bg-white text-slate-600 shadow-sm dark:border-slate-700 dark:bg-[#252a31] dark:text-slate-300 sm:flex">
                <button onClick={() => updateEditorFontSize(-1)} title="Decrease editor font size" className="h-6 px-2 text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-700">A−</button>
                <span className="min-w-7 border-x border-[#d8dce2] text-center font-mono text-[10px] dark:border-slate-700">{editorFontSize}</span>
                <button onClick={() => updateEditorFontSize(1)} title="Increase editor font size" className="h-6 px-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700">A+</button>
              </div>
            </div>

            {/* Monaco Editor (Crisp Notepad++ Canvas) */}
            <section className="flex-1 min-h-0 bg-white dark:bg-[#1e2227]">
              <Editor
                height="100%"
                theme={theme === 'dark' ? 'notepad-dark' : 'notepad-light'}
                onMount={handleMount}
                options={{
                  fontSize: editorFontSize,
                  fontFamily: "'Consolas', 'Courier New', 'Lucida Console', monospace",
                  minimap: { enabled: false },
                  automaticLayout: true,
                  padding: { top: 6 },
                  tabSize: 4,
                  insertSpaces: true,
                  lineNumbers: 'on',
                  bracketPairColorization: { enabled: true },
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  renderLineHighlight: 'all',
                  wordWrap: 'on'
                }}
              />
            </section>

            {/* Collapsible Output Terminal */}
            {showTerminal && (
              <CodeHubOutputTerminal
                output={terminalOutput}
                error={terminalError}
                isLoading={isRunning}
                execMeta={execMeta}
                stdin={stdin}
                onStdinChange={setStdin}
                onClear={() => {
                  setTerminalOutput('');
                  setTerminalError('');
                  setExecMeta(null);
                }}
                onClose={() => setShowTerminal(false)}
              />
            )}

            {/* Notepad++ Classic Segmented Status Bar */}
            <div className="h-6 bg-[#f0f0f0] dark:bg-[#181a1f] border-t border-[#d0d0d0] dark:border-slate-800 flex items-center text-[11px] font-sans text-slate-700 dark:text-slate-300 select-none shrink-0 overflow-hidden px-1 divide-x divide-[#d4d4d4] dark:divide-slate-800">
              {/* 1. File Type Description */}
              <div className="px-2.5 py-0.5 min-w-[130px] truncate">
                {activeFile.endsWith('.cpp') || activeFile.endsWith('.c')
                  ? 'C++ source file'
                  : activeFile.endsWith('.py')
                  ? 'Python file'
                  : activeFile.endsWith('.js')
                  ? 'JavaScript source file'
                  : 'Normal text file'}
              </div>

              {/* 2. Length and Lines */}
              <div className="px-2.5 py-0.5 truncate hidden sm:block">
                length: {cursorPos.chars ?? 0}&nbsp;&nbsp;lines: {cursorPos.lines ?? 1}
              </div>

              {/* 3. Line, Col, Pos */}
              <div className="px-2.5 py-0.5 whitespace-nowrap">
                Ln: {cursorPos.line}&nbsp;&nbsp;Col: {cursorPos.col}&nbsp;&nbsp;Pos: {cursorPos.pos ?? 1}
              </div>

              {/* 4. Windows (CR LF) */}
              <div className="px-2.5 py-0.5 hidden md:block whitespace-nowrap">
                Windows (CR LF)
              </div>

              {/* 5. Encoding */}
              <div className="px-2.5 py-0.5 hidden md:block whitespace-nowrap">
                UTF-8
              </div>

              {/* 6. Mode */}
              <div className="px-2.5 py-0.5 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                INS
              </div>

              {/* 7. Terminal Quick Click in Status Bar */}
              <button
                onClick={() => setShowTerminal((p) => !p)}
                className="px-2.5 py-0.5 hover:bg-slate-300 dark:hover:bg-slate-800 flex items-center gap-1.5 text-blue-600 dark:text-cyan-400 font-mono text-[11px] font-semibold cursor-pointer transition ml-auto"
                title="Toggle Output Terminal"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{showTerminal ? 'Hide Terminal' : 'Terminal'}</span>
              </button>
            </div>
          </div>

          {/* Real-time Team Chat Drawer (RIGHT SIDE ONLY with Draggable Resize) */}
          {showChat && (
            <div
              style={{ width: `${chatWidth}px` }}
              className="h-full flex shrink-0 z-30 shadow-lg relative"
            >
              {/* Draggable Divider for Right Chat */}
              <div
                onMouseDown={handleMouseDownChatResize}
                className="w-1.5 hover:w-2 bg-[#d8d8d8]/80 dark:bg-slate-800 hover:bg-blue-500 active:bg-blue-600 cursor-col-resize select-none shrink-0 transition-all h-full z-30"
                title="Drag to resize chat drawer"
              />
              <div className="flex-1 h-full min-w-0">
                <ChatDrawer
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onClose={() => setShowChat(false)}
                  userCount={users.length}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden File Input for Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />
      <input type="file" ref={folderInputRef} onChange={handleFileUpload} className="hidden" webkitdirectory="" directory="" multiple />

      {/* New File / New Folder Modal (prompts name, extension pills, validation) */}
      <NewItemModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        parentPath={modalState.parentPath}
        existingNames={Array.from(yFiles?.keys() || [])}
        onClose={handleCloseModal}
        onCreate={handleCreateModalItem}
      />

      {/* Save / Upload Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-2 bg-slate-900/90 dark:bg-blue-950/90 text-white px-3.5 py-2 rounded-md shadow-2xl border border-slate-700 dark:border-blue-800 text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Share Modal */}
      <ShareRoomModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        room={room}
      />
    </div>
  );
};
