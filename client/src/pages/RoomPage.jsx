import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { roomService } from '../services/room.js';
import { fileService } from '../services/file.js';
import { chatService } from '../services/chat.js';
import { executionService } from '../services/execution.js';
import { connectSocket, getSocket } from '../socket/socket.js';
import { SOCKET_EVENTS } from '@codesync/shared/events';
import { ROLES, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '@codesync/shared/constants';

import { FileExplorer } from '../components/FileExplorer.jsx';
import { MonacoEditor } from '../editor/MonacoEditor.jsx';
import { Terminal } from '../components/Terminal.jsx';
import { ChatDrawer } from '../components/ChatDrawer.jsx';
import { PresenceBar } from '../components/PresenceBar.jsx';
import { ShareRoomModal } from '../components/ShareRoomModal.jsx';

import {
  Play,
  Share2,
  MessageSquare,
  ChevronDown,
  Terminal as TerminalIcon,
  FolderTree,
  ArrowLeft,
  Loader2,
  Shield,
  Eye,
  Edit3
} from 'lucide-react';

export const RoomPage = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [room, setRoom] = useState(null);
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [presence, setPresence] = useState([]);
  const [collaboratorCursors, setCollaboratorCursors] = useState([]);
  const [myRole, setMyRole] = useState(ROLES.EDITOR);

  // Layout toggles
  const [showExplorer, setShowExplorer] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Execution state
  const [stdin, setStdin] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionState, setExecutionState] = useState('Ready');
  const [executionResult, setExecutionResult] = useState(null);

  // Loading & Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Refs
  const saveTimeoutRef = useRef(null);
  const activeFile = files.find((f) => f.id === activeFileId);

  // 1. Fetch Room, Files, and Messages
  useEffect(() => {
    let isMounted = true;

    const loadRoomData = async () => {
      try {
        setLoading(true);
        setError('');

        const roomData = await roomService.getRoomDetail(roomId);
        if (!isMounted) return;

        setRoom(roomData);
        setFiles(roomData.files || []);
        if (roomData.files?.length > 0) {
          setActiveFileId(roomData.files[0].id);
        }
        if (roomData.myRole) {
          setMyRole(roomData.myRole);
        }

        // Fetch initial chat messages
        const initialMessages = await chatService.getMessages(roomData.id);
        if (isMounted) {
          setMessages(initialMessages);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load room');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRoomData();

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  // 2. Socket.IO Connection & Events Setup
  useEffect(() => {
    if (!room?.id) return;

    const socket = connectSocket();

    // Join room channel
    socket.emit(SOCKET_EVENTS.ROOM_JOIN, {
      roomId: room.id,
      fileId: activeFileId
    });

    // Room joined acknowledgement
    socket.on(SOCKET_EVENTS.ROOM_JOINED, (data) => {
      if (data.role) setMyRole(data.role);
      if (data.presence) setPresence(data.presence);
    });

    // Presence updates
    socket.on(SOCKET_EVENTS.PRESENCE_SYNC, (collaborators) => {
      setPresence(collaborators);
    });

    socket.on(SOCKET_EVENTS.USER_JOINED, (collaborator) => {
      setPresence((prev) => {
        const filtered = prev.filter((p) => p.socketId !== collaborator.socketId);
        return [...filtered, collaborator];
      });
    });

    socket.on(SOCKET_EVENTS.USER_LEFT, ({ socketId }) => {
      setPresence((prev) => prev.filter((p) => p.socketId !== socketId));
      setCollaboratorCursors((prev) => prev.filter((c) => c.socketId !== socketId));
    });

    // Collaborator cursors broadcast
    socket.on(SOCKET_EVENTS.CURSOR_BROADCAST, (cursorData) => {
      setCollaboratorCursors((prev) => {
        const filtered = prev.filter((c) => c.userId !== cursorData.userId);
        return [...filtered, cursorData];
      });
    });

    // Real-time Editor change broadcast from a peer
    socket.on(SOCKET_EVENTS.EDITOR_BROADCAST, ({ fileId, changes }) => {
      setFiles((prevFiles) =>
        prevFiles.map((file) => {
          if (file.id !== fileId) return file;

          let updatedContent = file.content;
          if (changes && changes.length > 0) {
            // Apply single or multiple delta changes
            for (const ch of changes) {
              if (typeof ch.rangeOffset === 'number' && typeof ch.rangeLength === 'number') {
                const before = updatedContent.slice(0, ch.rangeOffset);
                const after = updatedContent.slice(ch.rangeOffset + ch.rangeLength);
                updatedContent = before + ch.text + after;
              } else if (typeof ch.text === 'string') {
                updatedContent = ch.text;
              }
            }
          }
          return { ...file, content: updatedContent };
        })
      );
    });

    // Real-time Chat message
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    // File events
    socket.on(SOCKET_EVENTS.FILE_CREATED, (newFile) => {
      setFiles((prev) => [...prev, newFile]);
    });

    socket.on(SOCKET_EVENTS.FILE_RENAMED, (updatedFile) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === updatedFile.id ? updatedFile : f))
      );
    });

    socket.on(SOCKET_EVENTS.FILE_DELETED, ({ fileId }) => {
      setFiles((prev) => {
        const remaining = prev.filter((f) => f.id !== fileId);
        if (activeFileId === fileId && remaining.length > 0) {
          setActiveFileId(remaining[0].id);
        }
        return remaining;
      });
    });

    return () => {
      socket.emit(SOCKET_EVENTS.ROOM_LEAVE);
      socket.off(SOCKET_EVENTS.ROOM_JOINED);
      socket.off(SOCKET_EVENTS.PRESENCE_SYNC);
      socket.off(SOCKET_EVENTS.USER_JOINED);
      socket.off(SOCKET_EVENTS.USER_LEFT);
      socket.off(SOCKET_EVENTS.CURSOR_BROADCAST);
      socket.off(SOCKET_EVENTS.EDITOR_BROADCAST);
      socket.off(SOCKET_EVENTS.CHAT_MESSAGE);
      socket.off(SOCKET_EVENTS.FILE_CREATED);
      socket.off(SOCKET_EVENTS.FILE_RENAMED);
      socket.off(SOCKET_EVENTS.FILE_DELETED);
    };
  }, [room?.id]);

  // 3. Handle Editor Content Change (Local Edit)
  const handleContentChange = useCallback((newContent, rawChanges = []) => {
    if (!activeFileId || !room?.id) return;

    // Update local state immediately
    setFiles((prevFiles) =>
      prevFiles.map((f) => (f.id === activeFileId ? { ...f, content: newContent } : f))
    );

    // Format changes for operational sync
    const changes = rawChanges.map((c) => ({
      rangeOffset: c.rangeOffset,
      rangeLength: c.rangeLength,
      text: c.text
    }));

    // Broadcast operation delta over socket
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit(SOCKET_EVENTS.EDITOR_OPERATION, {
        roomId: room.id,
        fileId: activeFileId,
        version: (activeFile?.version || 1) + 1,
        changes
      });
    }

    // Debounce save to database (every 1.5s)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fileService.updateContent(activeFileId, newContent);
      } catch (err) {
        console.error('Failed to auto-save file:', err);
      }
    }, 1500);
  }, [activeFileId, room?.id, activeFile?.version]);

  // 4. Handle Local Cursor / Selection Movement
  const handleCursorChange = useCallback(({ line, column, selection }) => {
    if (!room?.id || !activeFileId) return;

    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit(SOCKET_EVENTS.CURSOR_UPDATE, {
        roomId: room.id,
        fileId: activeFileId,
        line,
        column,
        selection
      });
    }
  }, [room?.id, activeFileId]);

  // 5. File Operations
  const handleCreateFile = async (name) => {
    const newFile = await fileService.createFile({
      roomId: room.id,
      name,
      path: `/${name}`,
      content: ''
    });
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);

    const socket = getSocket();
    if (socket) socket.emit(SOCKET_EVENTS.FILE_CREATED, { roomId: room.id, file: newFile });
  };

  const handleRenameFile = async (fileId, newName) => {
    const updated = await fileService.renameFile(fileId, newName);
    setFiles((prev) => prev.map((f) => (f.id === fileId ? updated : f)));

    const socket = getSocket();
    if (socket) socket.emit(SOCKET_EVENTS.FILE_RENAMED, { roomId: room.id, file: updated });
  };

  const handleDeleteFile = async (fileId) => {
    await fileService.deleteFile(fileId, room.id);
    setFiles((prev) => {
      const remaining = prev.filter((f) => f.id !== fileId);
      if (activeFileId === fileId && remaining.length > 0) {
        setActiveFileId(remaining[0].id);
      }
      return remaining;
    });

    const socket = getSocket();
    if (socket) socket.emit(SOCKET_EVENTS.FILE_DELETED, { roomId: room.id, fileId });
  };

  // 6. Real-time Chat Sending
  const handleSendMessage = (text) => {
    const socket = getSocket();
    if (socket) {
      socket.emit(SOCKET_EVENTS.CHAT_SEND, {
        roomId: room.id,
        content: text
      });
    }
  };

  // 7. Execute Code with Judge0 Engine
  const handleExecuteCode = async () => {
    if (!activeFile || isExecuting) return;

    try {
      setIsExecuting(true);
      setShowTerminal(true);
      setExecutionState('Submitting to Judge0...');

      setTimeout(() => {
        if (isExecuting) setExecutionState('Compiling & executing...');
      }, 500);

      const result = await executionService.executeCode({
        roomId: room.id,
        fileId: activeFile.id,
        language: activeFile.language || 'cpp',
        code: activeFile.content,
        stdin
      });

      setExecutionResult(result);
      setExecutionState('Completed');
    } catch (err) {
      setExecutionResult({
        status: 'EXECUTION_ERROR',
        stdout: '',
        stderr: '',
        compileError: '',
        runtimeError: err.message || 'Execution request failed',
        exitCode: 1,
        executionTime: 0,
        memoryUsed: 0
      });
      setExecutionState('Failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const canEdit = myRole === ROLES.OWNER || myRole === ROLES.EDITOR;

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-dark-950 text-dark-400 font-mono text-xs">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500 mb-2" />
        <span>Loading collaborative room workspace...</span>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-dark-950 text-dark-300 px-4">
        <div className="p-6 bg-dark-900 border border-dark-750 rounded-xl text-center max-w-md">
          <h2 className="text-base font-semibold text-dark-100 mb-2">Room Error</h2>
          <p className="text-xs text-dark-400 mb-4">{error || 'Room not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-900 overflow-hidden select-none">
      {/* 1. IDE Top Bar */}
      <header className="h-12 border-b border-dark-700 bg-dark-950 px-3 flex items-center justify-between z-30 shrink-0">
        {/* Left: Back, Room Name, Role */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/dashboard')}
            title="Back to Dashboard"
            className="p-1.5 hover:bg-dark-800 text-dark-400 hover:text-dark-100 rounded-md transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-semibold text-dark-100 tracking-tight max-w-[200px] truncate">
              {room.name}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-dark-800 text-dark-400 border border-dark-700 uppercase">
              {activeFile?.language || 'cpp'}
            </span>
          </div>

          {!canEdit && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent-amber/10 border border-accent-amber/20 text-accent-amber text-[10px] font-medium">
              <Eye className="w-3 h-3" />
              VIEW ONLY
            </span>
          )}
        </div>

        {/* Center: Presence & Room Code */}
        <div className="hidden md:flex items-center space-x-3">
          <PresenceBar
            room={room}
            presence={presence}
            onShare={() => setIsShareModalOpen(true)}
          />
        </div>

        {/* Right: Actions (Run, Layout Toggles) */}
        <div className="flex items-center space-x-2">
          {/* Run Button */}
          <button
            onClick={handleExecuteCode}
            disabled={isExecuting || !activeFile}
            title="Execute Code (Ctrl + Enter)"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-accent-emerald hover:bg-accent-emerald/90 text-dark-950 font-bold rounded-md text-xs shadow-md transition disabled:opacity-50"
          >
            {isExecuting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Run Code</span>
          </button>

          {/* Panel toggles */}
          <div className="flex items-center space-x-1 border-l border-dark-750 pl-2">
            <button
              onClick={() => setShowExplorer(!showExplorer)}
              title="Toggle File Explorer"
              className={`p-1.5 rounded-md transition ${
                showExplorer ? 'bg-dark-800 text-brand-400' : 'text-dark-400 hover:bg-dark-800 hover:text-dark-200'
              }`}
            >
              <FolderTree className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowTerminal(!showTerminal)}
              title="Toggle Terminal"
              className={`p-1.5 rounded-md transition ${
                showTerminal ? 'bg-dark-800 text-brand-400' : 'text-dark-400 hover:bg-dark-800 hover:text-dark-200'
              }`}
            >
              <TerminalIcon className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowChat(!showChat)}
              title="Toggle Chat"
              className={`p-1.5 rounded-md transition ${
                showChat ? 'bg-dark-800 text-brand-400' : 'text-dark-400 hover:bg-dark-800 hover:text-dark-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main IDE Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: File Explorer */}
        {showExplorer && (
          <aside className="w-56 shrink-0 h-full border-r border-dark-700 bg-dark-950">
            <FileExplorer
              files={files}
              activeFileId={activeFileId}
              onSelectFile={(id) => setActiveFileId(id)}
              onCreateFile={handleCreateFile}
              onRenameFile={handleRenameFile}
              onDeleteFile={handleDeleteFile}
              canEdit={canEdit}
            />
          </aside>
        )}

        {/* Center: Editor + Terminal Split */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Editor Container */}
          <div className="flex-1 min-h-0 relative">
            {activeFile ? (
              <MonacoEditor
                file={activeFile}
                readOnly={!canEdit}
                collaboratorCursors={collaboratorCursors}
                onContentChange={handleContentChange}
                onCursorChange={handleCursorChange}
                onExecuteShortcut={handleExecuteCode}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-dark-500 text-xs">
                No active file selected.
              </div>
            )}
          </div>

          {/* Bottom Terminal Panel */}
          {showTerminal && (
            <div className="h-56 shrink-0">
              <Terminal
                executionResult={executionResult}
                isExecuting={isExecuting}
                executionState={executionState}
                stdin={stdin}
                onStdinChange={setStdin}
                onClear={() => setExecutionResult(null)}
              />
            </div>
          )}
        </main>

        {/* Right: Chat Drawer */}
        {showChat && (
          <aside className="w-72 shrink-0 h-full border-l border-dark-700 bg-dark-950">
            <ChatDrawer
              messages={messages}
              onSendMessage={handleSendMessage}
              onClose={() => setShowChat(false)}
            />
          </aside>
        )}
      </div>

      {/* Share Modal */}
      <ShareRoomModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        room={room}
      />
    </div>
  );
};
