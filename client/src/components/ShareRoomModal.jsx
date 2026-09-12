import React, { useState } from 'react';
import { X, Copy, Check, Link2, Hash } from 'lucide-react';

export const ShareRoomModal = ({ isOpen, onClose, room }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen || !room) return null;

  const roomUrl = `${window.location.origin}/room/${room.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-dark-900 border border-dark-700 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-dark-750 flex items-center justify-between">
          <h2 className="text-base font-semibold text-dark-100">Invite Collaborators</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-dark-800 text-dark-400 hover:text-dark-100 rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-brand-400" />
              Room Code
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={room.roomCode}
                className="flex-1 px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-sm font-mono tracking-wider text-brand-400 focus:outline-none"
              />
              <button
                onClick={handleCopyCode}
                className="px-3 py-2 bg-dark-750 hover:bg-dark-700 border border-dark-600 rounded-lg text-xs font-semibold text-dark-100 flex items-center gap-1.5 transition"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-accent-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-brand-400" />
              Direct Invite Link
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={roomUrl}
                className="flex-1 px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-xs font-mono text-dark-300 focus:outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 bg-dark-750 hover:bg-dark-700 border border-dark-600 rounded-lg text-xs font-semibold text-dark-100 flex items-center gap-1.5 transition"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-accent-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-dark-800/60 rounded-lg border border-dark-750 text-xs text-dark-400 leading-relaxed">
            Anyone with the room code or link can join this room, view real-time changes, chat, and participate in collaborative coding.
          </div>
        </div>
      </div>
    </div>
  );
};
