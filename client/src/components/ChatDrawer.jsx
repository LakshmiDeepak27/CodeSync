import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';

export const ChatDrawer = ({ messages = [], onSendMessage, onClose }) => {
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

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="h-full flex flex-col bg-dark-950 border-l border-dark-700 select-none">
      {/* Header */}
      <div className="h-9 px-3 border-b border-dark-750 flex items-center justify-between text-xs font-semibold text-dark-300">
        <span className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-brand-400" />
          Room Chat
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-dark-800 text-dark-400 hover:text-dark-100 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-sans">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-dark-500 text-xs px-4">
            <MessageSquare className="w-8 h-8 text-dark-700 mb-2 stroke-[1.5]" />
            <p>No messages yet.</p>
            <p className="mt-1 text-dark-500">Coordinate and chat with collaborators here.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.userId === user?.id;
            return (
              <div key={msg.id || index} className="flex space-x-2 text-xs">
                <img
                  src={msg.user?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${msg.user?.username || 'user'}`}
                  alt={msg.user?.username}
                  className="w-6 h-6 rounded-full bg-dark-800 border border-dark-700 shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <span className={`font-semibold truncate ${isMe ? 'text-brand-400' : 'text-dark-200'}`}>
                      {msg.user?.name || msg.user?.username || 'Collaborator'}
                    </span>
                    <span className="text-[10px] text-dark-500">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <p className="text-dark-300 break-words leading-relaxed select-text">
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-dark-750 bg-dark-900 flex items-center space-x-1.5">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-dark-800 border border-dark-700 rounded-md px-2.5 py-1.5 text-xs text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          disabled={!content.trim()}
          className="p-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 text-white rounded-md transition shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
