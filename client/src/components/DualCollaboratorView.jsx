import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';
import * as Y from 'yjs';
import { Play, Loader2, MessageSquare, Send, Users, Terminal, X, CheckCircle2, Split } from 'lucide-react';
import { useYjs, getColorForUser } from '../hooks/useYjs.js';
import { executionService } from '../services/execution.js';
import { chatService } from '../services/chat.js';
import { connectSocket, getSocket } from '../socket/socket.js';
import { SOCKET_EVENTS } from '@codesync/shared/events';
import { Avatar } from './Avatar.jsx';

// Collaborator Panel Component
function CollaboratorPane({
  roomId,
  username,
  roleLabel,
  userColor,
  activeFile = 'main.py',
  onClose,
  theme = 'dark'
}) {
  const editorRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const [monaco, setMonaco] = useState(null);
  const bindingRef = useRef(null);

  const { ydoc, yFiles, synced, users, isConnected, provider } = useYjs(roomId, username);

  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [execOutput, setExecOutput] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(true);
  const messagesEndRef = useRef(null);

  // Initialize and listen to Chat
  useEffect(() => {
    if (!roomId) return;
    chatService.getRoomMessages(roomId).then((msgs) => {
      if (Array.isArray(msgs)) setMessages(msgs);
    }).catch(() => {});

    const socket = connectSocket();
    const handleMsg = (m) => {
      setMessages((prev) => [...prev, m]);
    };
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, handleMsg);
    return () => {
      socket.off(SOCKET_EVENTS.CHAT_MESSAGE, handleMsg);
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    try {
      // Local optimistic message
      const optMsg = {
        id: `local_${Date.now()}`,
        content: text,
        roomId,
        createdAt: new Date().toISOString(),
        user: { name: username, username }
      };
      setMessages((prev) => [...prev, optMsg]);
      setChatInput('');

      // Send via socket broadcast
      const s = getSocket();
      if (s && s.connected) {
        s.emit(SOCKET_EVENTS.CHAT_MESSAGE, optMsg);
      }
      // Also persist to API
      chatService.sendMessage(roomId, text).catch(() => {});
    } catch {}
  };

  // Mount Monaco
  const handleMount = (editorInstance, monacoInstance) => {
    editorRef.current = editorInstance;
    setEditor(editorInstance);
    setMonaco(monacoInstance);

    // Track local cursor awareness
    editorInstance.onDidChangeCursorPosition((e) => {
      if (provider?.awareness) {
        const model = editorInstance.getModel();
        const yText = yFiles?.get(activeFile);
        if (model && yText) {
          try {
            const sel = editorInstance.getSelection();
            const startPos = sel ? sel.getStartPosition() : e.position;
            const endPos = sel ? sel.getEndPosition() : e.position;
            provider.awareness.setLocalStateField('selection', {
              anchor: Y.createRelativePositionFromTypeIndex(yText, model.getOffsetAt(startPos)),
              head: Y.createRelativePositionFromTypeIndex(yText, model.getOffsetAt(endPos))
            });
          } catch {}
        }
      }
    });
  };

  // Bind Yjs to Monaco
  useEffect(() => {
    if (!editor || !monaco || !yFiles) return;

    let yText = yFiles.get(activeFile);
    if (!yText) {
      if (synced && yFiles.size === 0) {
        yText = new Y.Text('print("🚀 Hello from CodeSync Collaborative Engine!")\n');
        yFiles.set(activeFile, yText);
      } else {
        return;
      }
    }

    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    // Use unique model URI per user pane to prevent Monaco model collision
    const uri = monaco.Uri.parse(`inmemory://room/${roomId}/${username}/${activeFile}`);
    let model = monaco.editor.getModel(uri);
    if (!model) {
      model = monaco.editor.createModel(yText.toString(), 'python', uri);
    } else if (model.getValue() !== yText.toString()) {
      model.setValue(yText.toString());
    }

    editor.setModel(model);

    const binding = new MonacoBinding(
      yText,
      model,
      new Set([editor]),
      provider?.awareness
    );
    bindingRef.current = binding;

    if (provider?.awareness) {
      provider.awareness.setLocalStateField('user', {
        name: username,
        username,
        activeFile,
        color: userColor,
        colorLight: userColor + '33'
      });
    }

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [editor, monaco, yFiles, synced, activeFile, provider, username, roomId, userColor]);

  // Run code handler
  const handleRun = async () => {
    if (!editor) return;
    try {
      setIsRunning(true);
      setShowTerminal(true);
      setExecOutput('Compiling and executing in isolated sandbox...\n');

      const code = editor.getValue();
      const res = await executionService.execute({
        source_code: code,
        language_id: 71, // Python 3
        stdin: ''
      });

      const stdout = res.stdout || res.output || '';
      const stderr = res.stderr || res.compile_output || '';
      const statusDesc = res.status?.description || 'SUCCESS';
      const time = res.time ? ` (${res.time}s)` : '';

      setExecOutput(`[Status: ${statusDesc}${time}]\n${stdout}${stderr ? '\n[STDERR]: ' + stderr : ''}`);
    } catch (err) {
      setExecOutput(`Execution Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 border-r border-cyan-100/15 last:border-r-0 bg-[#09151e] text-slate-200 overflow-hidden select-none">
      {/* User Status Bar */}
      <header className="h-11 px-3 bg-[#061118] border-b border-cyan-100/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar username={username} size={26} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-white truncate">{username}</span>
              <span
                className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold"
                style={{ backgroundColor: userColor + '25', color: userColor }}
              >
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}
            title={isConnected ? 'Synced & Live' : 'Connecting'}
          />

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2ea44f] hover:bg-[#2c9749] text-white rounded text-[11px] font-bold transition shadow-xs disabled:opacity-50"
            title="Run code via Judge0"
          >
            {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
            <span>Run</span>
          </button>

          <button
            onClick={() => setShowChat((p) => !p)}
            className={`p-1.5 rounded transition ${
              showChat
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Toggle Live Chat"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowTerminal((p) => !p)}
            className={`p-1.5 rounded transition ${
              showTerminal
                ? 'bg-slate-700 text-cyan-300'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Toggle Output Terminal"
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Editor & Sub-Panels */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Monaco Editor Canvas */}
        <div className="flex-1 min-h-0 bg-[#0d1b24]">
          <Editor
            height="100%"
            theme="vs-dark"
            defaultLanguage="python"
            onMount={handleMount}
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Consolas', monospace",
              minimap: { enabled: false },
              automaticLayout: true,
              padding: { top: 8 },
              tabSize: 4,
              lineNumbers: 'on',
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              renderLineHighlight: 'all',
              wordWrap: 'on'
            }}
          />
        </div>

        {/* Terminal Output Panel */}
        {showTerminal && (
          <div className="h-32 bg-[#040b10] border-t border-cyan-100/15 flex flex-col font-mono text-xs">
            <div className="h-6 px-2.5 bg-[#081722] border-b border-cyan-100/10 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <Terminal className="w-3 h-3" /> Output Console
              </span>
              <button
                onClick={() => setShowTerminal(false)}
                className="hover:text-white text-slate-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <pre className="flex-1 p-2 overflow-y-auto text-emerald-400 font-mono text-[11px] whitespace-pre-wrap">
              {execOutput || 'Ready. Click "Run" to execute program.'}
            </pre>
          </div>
        )}

        {/* Live Mini Chat Panel */}
        {showChat && (
          <div className="h-36 bg-[#061118] border-t border-cyan-100/15 flex flex-col text-xs font-sans">
            <div className="h-6 px-2.5 bg-[#081722] border-b border-cyan-100/10 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-[#84dfff] font-bold">
                <MessageSquare className="w-3 h-3" /> Live Room Chat
              </span>
              <button
                onClick={() => setShowChat(false)}
                className="hover:text-white text-slate-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-[11px]">
                  No messages yet. Say hello!
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isMe = (m.user?.username || m.user?.name) === username;
                  const sender = m.user?.name || m.user?.username || 'Collaborator';
                  return (
                    <div
                      key={m.id || idx}
                      className={`flex gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`rounded px-2 py-1 max-w-[85%] text-[11px] leading-tight ${
                          isMe
                            ? 'bg-blue-600/90 text-white'
                            : 'bg-[#122836] text-slate-200 border border-cyan-100/10'
                        }`}
                      >
                        <div className="text-[9px] font-mono opacity-70 mb-0.5">
                          {isMe ? 'You' : sender}
                        </div>
                        <div>{m.content}</div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-1.5 bg-[#040c11] border-t border-cyan-100/10 flex gap-1">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Chat as ${username}...`}
                className="flex-1 bg-[#091a24] border border-cyan-100/10 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition disabled:opacity-30"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// Master Dual Collaborator View Component
export function DualCollaboratorView({
  roomId,
  user1Name = 'Alex Demo',
  user2Name = 'Elena Rostova',
  onClose
}) {
  return (
    <div className="fixed inset-0 z-50 bg-[#020a0f] flex flex-col font-sans">
      {/* Top Banner */}
      <header className="h-10 px-4 bg-[#05141e] border-b border-cyan-400/20 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-tr from-cyan-500 to-purple-500 text-white shadow-xs">
              <Split className="w-3 h-3" />
            </span>
            <span>Simultaneous 2-User Real-Time Collaboration</span>
          </div>
          <span className="hidden sm:inline text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
            ● Dual Live Sockets Active
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden md:inline">
            Both users share the exact same room state via Yjs &amp; WebSockets
          </span>
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded text-xs transition"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close Dual View</span>
          </button>
        </div>
      </header>

      {/* Side-by-Side Dual Panes */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <CollaboratorPane
          roomId={roomId}
          username={user1Name}
          roleLabel="Host (You)"
          userColor="#38bdf8"
          activeFile="main.py"
          onClose={onClose}
        />
        <CollaboratorPane
          roomId={roomId}
          username={user2Name}
          roleLabel="Collaborator"
          userColor="#ec4899"
          activeFile="main.py"
          onClose={onClose}
        />
      </div>
    </div>
  );
}
