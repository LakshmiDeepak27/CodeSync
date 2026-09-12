import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { Avatar } from './Avatar.jsx';

export const ChatDrawer = ({ messages = [], onSendMessage, onClose, userCount = 0 }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setContent('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#181a1f] border-l border-[#d8d8d8] dark:border-slate-800 text-slate-800 dark:text-slate-200 select-none shadow-md font-sans">
      {/* Header */}
      <div className="h-10 px-3 border-b border-[#d8d8d8] dark:border-slate-800 bg-[#f0f2f5] dark:bg-[#21252b] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Room Chat</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            ({userCount} online)
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close room chat"
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar bg-[#fafafa] dark:bg-[#181a1f]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs px-4 py-8">
            <MessageSquare className="w-6 h-6 text-slate-400 mb-1.5" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No messages yet</p>
            <p className="mt-1 text-[11px] text-slate-400 max-w-[200px]">
              Chat, discuss code, and coordinate with room members here.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.userId === user?.id || msg.user?.username === user?.username;
            const senderName = msg.user?.name || msg.user?.username || 'Collaborator';

            return (
              <div
                key={msg.id || index}
                className={`flex gap-2 text-xs ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className="shrink-0 mt-0.5">
                  <Avatar username={msg.user?.username || senderName} size={20} />
                </div>

                <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5 px-1 text-[10px] text-slate-500 font-mono">
                    <span className={`font-semibold ${isMe ? 'text-blue-600 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {isMe ? 'You' : senderName}
                    </span>
                    <span>•</span>
                    <span>{formatTime(msg.createdAt)}</span>
                  </div>

                  <div
                    className={`rounded-md px-2.5 py-1.5 text-xs leading-relaxed break-words select-text ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-[#21252b] text-slate-800 dark:text-slate-100 border border-[#d8d8d8] dark:border-slate-700 rounded-tl-none shadow-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSubmit}
        className="p-2 border-t border-[#d8d8d8] dark:border-slate-800 bg-[#f0f2f5] dark:bg-[#21252b] flex items-center gap-1.5"
      >
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send)"
          aria-label="Message room collaborators"
          className="flex-1 min-w-0 bg-white dark:bg-[#181a1f] border border-[#d8d8d8] dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition font-sans"
        />
        <button
          type="submit"
          disabled={!content.trim()}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded transition shrink-0 flex items-center gap-1"
          title="Send message"
        >
          <Send className="w-3 h-3 fill-current" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
