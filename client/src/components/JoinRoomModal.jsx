import React, { useEffect, useState } from 'react';
import { X, ArrowRight, Hash } from 'lucide-react';

export const JoinRoomModal = ({ isOpen, onClose, onJoin }) => {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleEscape = (event) => event.key === 'Escape' && onClose();
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = roomCode.trim().toUpperCase();
    if (!trimmed) return;

    try {
      setLoading(true);
      setError('');
      await onJoin(trimmed);
      onClose();
    } catch (err) {
      setError(err.message || 'Room not found or invalid room code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onMouseDown={(event) => event.target === event.currentTarget && onClose()} className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="join-room-title" className="w-full max-w-sm bg-[#061923] border border-cyan-100/20 rounded-xl shadow-2xl">
        <div className="px-5 py-4 border-b border-cyan-100/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-md bg-[#0b2d3c] text-[#84dfff] flex items-center justify-center">
              <Hash className="w-4 h-4" />
            </div>
            <h2 id="join-room-title" className="text-base font-semibold text-dark-100">Join coding room</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close join room dialog"
            className="p-1.5 hover:bg-dark-800 text-dark-400 hover:text-dark-100 rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-accent-rose/10 border border-accent-rose/20 rounded-md text-xs text-accent-rose">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1.5">
              Enter Room Code
            </label>
            <input
              type="text"
              required
              autoFocus
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. 7A8B9C1D"
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded text-center text-base font-mono tracking-widest text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500 uppercase"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-dark-400 hover:text-dark-200 hover:bg-dark-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !roomCode.trim()}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-[#062033] bg-[#82dcff] hover:bg-[#b2edff] disabled:opacity-50 rounded-lg transition"
            >
              <span>{loading ? 'Joining...' : 'Join Room'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
