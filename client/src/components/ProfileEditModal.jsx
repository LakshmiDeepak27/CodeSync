import React, { useState, useEffect } from 'react';
import { X, User, Check, Sparkles, AlertCircle, Camera } from 'lucide-react';
import { Avatar } from './Avatar.jsx';

const AVATAR_PRESETS = [
  'Deepak',
  'Alex',
  'Jordan',
  'Morgan',
  'Sam',
  'Taylor',
  'Riley',
  'Chris'
];

export function ProfileEditModal({
  isOpen,
  onClose,
  currentUser,
  onSave
}) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarSeed, setAvatarSeed] = useState('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name || '');
      setUsername(currentUser.username || '');
      const savedBio = localStorage.getItem(`codesync-bio-${currentUser.id}`) || 'Full-Stack Developer passionate about collaborative coding.';
      setBio(savedBio);
      setAvatarSeed(currentUser.username || 'Coder');
      setCustomAvatarUrl(currentUser.avatarUrl || '');
      setError('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!trimmedName) {
      setError('Please enter your display name.');
      return;
    }
    if (!trimmedUsername) {
      setError('Please enter a valid username (letters, numbers, underscore).');
      return;
    }

    try {
      setIsSaving(true);
      const chosenAvatar = customAvatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(avatarSeed || trimmedUsername)}`;
      
      await onSave({
        name: trimmedName,
        username: trimmedUsername,
        avatarUrl: chosenAvatar
      });

      // Save bio to user preferences
      if (currentUser?.id) {
        localStorage.setItem(`codesync-bio-${currentUser.id}`, bio.trim());
      }

      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectPreset = (seed) => {
    setAvatarSeed(seed);
    setCustomAvatarUrl(`https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}`);
  };

  const currentPreviewAvatar = customAvatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(avatarSeed || username || 'Coder')}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in select-none font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#061923] border border-cyan-100/20 rounded-xl shadow-2xl overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-100/10 bg-[#04121a]">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#84dfff]" />
            <h3 className="text-sm font-bold tracking-tight text-white">Edit Developer Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Avatar Preview & Selection */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-[#08202d] border border-cyan-100/10">
            <div className="relative shrink-0">
              <img
                src={currentPreviewAvatar}
                alt="Avatar Preview"
                className="w-14 h-14 rounded-full bg-[#0d2e40] border-2 border-[#84dfff]/60 object-cover"
                onError={(e) => {
                  e.target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username || 'Dev')}`;
                }}
              />
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#84dfff] text-[#04121a]">
                <Camera className="w-3 h-3" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Avatar Theme & Presets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition border ${
                      avatarSeed === preset
                        ? 'bg-[#84dfff] text-[#04121a] border-[#84dfff] font-bold'
                        : 'bg-[#061923] text-slate-300 border-cyan-100/10 hover:border-cyan-100/30'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Full Name / Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Neeli Lakshmi Deepak"
              className="w-full px-3 py-2 text-xs rounded-md bg-[#04121a] border border-cyan-100/15 text-white placeholder-slate-500 focus:outline-none focus:border-[#84dfff] transition"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Username (@handle)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="username"
                className="w-full pl-7 pr-3 py-2 text-xs font-mono rounded-md bg-[#04121a] border border-cyan-100/15 text-white placeholder-slate-500 focus:outline-none focus:border-[#84dfff] transition"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Bio / Status
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other coders about yourself..."
              className="w-full px-3 py-2 text-xs rounded-md bg-[#04121a] border border-cyan-100/15 text-white placeholder-slate-500 focus:outline-none focus:border-[#84dfff] transition resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-cyan-100/10">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium rounded-md text-slate-300 hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 text-xs font-semibold rounded-md bg-[#84dfff] hover:bg-[#a6e8ff] text-[#04121a] shadow transition disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
