import React, { useEffect, useState } from 'react';
import { ArrowRight, Code2, Globe, Loader2, Lock, X } from 'lucide-react';

const LANGUAGES = [
  { id: 'cpp', label: 'C++', runtime: 'GCC 9.2.0' },
  { id: 'py', label: 'Python', runtime: 'Python 3.8.1' },
  { id: 'javascript', label: 'JavaScript', runtime: 'Node.js 18' },
  { id: 'c', label: 'C', runtime: 'GCC 9.2.0' }
];

export const CreateRoomModal = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('cpp');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleEscape = (event) => event.key === 'Escape' && onClose();
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      setError('');
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedLanguage = LANGUAGES.find((item) => item.id === language);
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError('');
      await onCreate({ name: name.trim(), description: description.trim(), language, visibility });
      onClose();
    } catch (err) {
      setError(err.message || 'Unable to create the room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onMouseDown={(event) => event.target === event.currentTarget && onClose()} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 font-sans">
      <div role="dialog" aria-modal="true" aria-labelledby="create-room-title" className="w-full max-w-[480px] border border-cyan-100/15 bg-[#061923] text-slate-200 shadow-2xl">
        <header className="flex items-center justify-between border-b border-cyan-100/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center border border-cyan-300/25 bg-[#082333] text-[#84dfff]"><Code2 className="h-4 w-4" /></span>
            <div>
              <h2 id="create-room-title" className="text-base font-semibold text-white">New room</h2>
              <p className="mt-0.5 text-xs text-slate-400">Create a shared coding workspace.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close create room dialog" className="p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          {error && <p role="alert" className="border border-rose-800/70 bg-rose-950/35 px-3 py-2.5 text-xs text-rose-300">{error}</p>}

          <div>
            <label htmlFor="room-name" className="mb-1.5 block text-xs font-medium text-slate-300">Room name <span className="text-[#84dfff]">*</span></label>
            <input id="room-name" type="text" required autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Algorithms practice" className="w-full border border-cyan-100/15 bg-[#04151f] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 transition focus:border-[#84dfff] focus:outline-none" />
          </div>

          <div>
            <label htmlFor="room-description" className="mb-1.5 block text-xs font-medium text-slate-300">Description <span className="font-normal text-slate-500">optional</span></label>
            <input id="room-description" type="text" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What are you working on?" className="w-full border border-cyan-100/15 bg-[#04151f] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 transition focus:border-[#84dfff] focus:outline-none" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="room-language" className="mb-1.5 block text-xs font-medium text-slate-300">Language</label>
              <select id="room-language" value={language} onChange={(event) => setLanguage(event.target.value)} className="w-full border border-cyan-100/15 bg-[#04151f] px-3 py-2.5 text-sm text-slate-100 focus:border-[#84dfff] focus:outline-none">
                {LANGUAGES.map((item) => <option key={item.id} value={item.id}>{item.label} — {item.runtime}</option>)}
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-slate-300">Access</span>
              <div className="flex border border-cyan-100/15 bg-[#04151f]">
                <button type="button" onClick={() => setVisibility('PUBLIC')} aria-pressed={visibility === 'PUBLIC'} className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition ${visibility === 'PUBLIC' ? 'bg-[#0c3041] text-[#84dfff]' : 'text-slate-400 hover:text-slate-200'}`}><Globe className="h-3.5 w-3.5" />Public</button>
                <button type="button" onClick={() => setVisibility('PRIVATE')} aria-pressed={visibility === 'PRIVATE'} className={`flex flex-1 items-center justify-center gap-1.5 border-l border-cyan-100/15 px-2 py-2.5 text-xs font-medium transition ${visibility === 'PRIVATE' ? 'bg-[#0c3041] text-[#84dfff]' : 'text-slate-400 hover:text-slate-200'}`}><Lock className="h-3.5 w-3.5" />Private</button>
              </div>
            </div>
          </div>

          <p className="border-l-2 border-cyan-300/45 pl-3 text-xs leading-relaxed text-slate-400">{visibility === 'PUBLIC' ? 'Anyone with the room link or code can join.' : 'Only people you invite can join this room.'} Runs with {selectedLanguage?.runtime}.</p>

          <footer className="flex items-center justify-end gap-2 border-t border-cyan-100/10 pt-4">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm font-medium text-slate-400 transition hover:text-white">Cancel</button>
            <button type="submit" disabled={loading || !name.trim()} className="inline-flex items-center gap-2 bg-[#82dcff] px-4 py-2.5 text-sm font-semibold text-[#062033] transition hover:bg-[#aee7fb] disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Creating…</> : <>Create room <ArrowRight className="h-4 w-4" /></>}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
