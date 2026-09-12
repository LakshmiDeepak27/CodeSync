import React from 'react';

export function Avatar({ username, size = 40, className = '' }) {
  const seed = encodeURIComponent(username || 'guest');
  const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`;

  return (
    <div
      className={`relative inline-block rounded overflow-hidden bg-slate-800 border-2 border-slate-700/50 shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={avatarUrl}
        alt={`${username}'s avatar`}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    </div>
  );
}
