import React, { useState } from 'react';
import { Users, Copy, Check, Share2, Shield, Edit3, Eye } from 'lucide-react';
import { ROLES } from '@codesync/shared/constants';

export const PresenceBar = ({ room, presence = [], onShare }) => {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = () => {
    if (!room?.roomCode) return;
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleIcon = (role) => {
    if (role === ROLES.OWNER) return <Shield className="w-3 h-3 text-accent-amber" />;
    if (role === ROLES.EDITOR) return <Edit3 className="w-3 h-3 text-brand-400" />;
    return <Eye className="w-3 h-3 text-dark-400" />;
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Room Code Badge with Copy */}
      <button
        onClick={copyRoomCode}
        title="Click to copy room code"
        className="flex items-center space-x-1.5 px-2.5 py-1 bg-dark-800 hover:bg-dark-750 border border-dark-700 rounded-md text-xs font-mono text-dark-300 hover:text-dark-100 transition shadow-sm"
      >
        <span className="text-dark-500 font-sans">CODE:</span>
        <span className="font-semibold text-brand-400">{room?.roomCode}</span>
        {copied ? (
          <Check className="w-3 h-3 text-accent-emerald shrink-0" />
        ) : (
          <Copy className="w-3 h-3 text-dark-500 hover:text-dark-300 shrink-0" />
        )}
      </button>

      {/* Online Collaborators Avatars */}
      <div className="flex items-center space-x-1.5 border-l border-dark-750 pl-3">
        <Users className="w-3.5 h-3.5 text-dark-500" />
        <div className="flex -space-x-1.5 overflow-hidden">
          {presence.slice(0, 5).map((p, idx) => (
            <div
              key={p.socketId || idx}
              title={`${p.name || p.username} (${p.role || 'Member'})`}
              className="relative inline-block"
            >
              <img
                src={p.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${p.username}`}
                alt={p.username}
                style={{ borderColor: p.color || '#38bdf8' }}
                className="w-6 h-6 rounded-full border-2 bg-dark-800 object-cover"
              />
              <span
                style={{ backgroundColor: p.color || '#38bdf8' }}
                className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full ring-1 ring-dark-900"
              />
            </div>
          ))}
        </div>

        {presence.length > 5 && (
          <span className="text-[10px] text-dark-400 font-medium">
            +{presence.length - 5}
          </span>
        )}
      </div>

      {onShare && (
        <button
          onClick={onShare}
          title="Share Room"
          className="p-1.5 bg-dark-800 hover:bg-dark-750 border border-dark-700 rounded-md text-dark-400 hover:text-dark-100 transition"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
