import React, { useState, useEffect, useRef } from 'react';
import { X, FileCode, Folder, AlertCircle } from 'lucide-react';

const COMMON_EXTENSIONS = [
  { ext: '.cpp', label: 'C++' },
  { ext: '.c', label: 'C' },
  { ext: '.py', label: 'Python' },
  { ext: '.js', label: 'JavaScript' },
  { ext: '.ts', label: 'TypeScript' },
  { ext: '.html', label: 'HTML' },
  { ext: '.css', label: 'CSS' },
  { ext: '.json', label: 'JSON' }
];

export function NewItemModal({
  isOpen,
  type = 'file', // 'file' | 'folder'
  parentPath = '',
  existingNames = [],
  onClose,
  onCreate
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setError('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, type, parentPath]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError(`Please enter a valid ${type} name.`);
      return;
    }

    // Disallow path separator in filename directly
    if (trimmed.includes('/') || trimmed.includes('\\')) {
      setError('Name cannot contain slashes. Use folders to organize.');
      return;
    }

    const fullPath = parentPath ? `${parentPath}/${trimmed}` : trimmed;
    if (existingNames.includes(fullPath)) {
      setError(`A ${type} with this name already exists in this location.`);
      return;
    }

    onCreate(trimmed, type, parentPath);
    onClose();
  };

  const appendExtension = (ext) => {
    if (type !== 'file') return;
    const base = name.replace(/\.[^/.]+$/, '');
    const newName = (base || 'main') + ext;
    setName(newName);
    setError('');
    inputRef.current?.focus();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#1e2227] rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-[#f8f9fa] dark:bg-[#21252b]">
          <div className="flex items-center gap-2">
            {type === 'file' ? (
              <FileCode className="w-4 h-4 text-blue-500" />
            ) : (
              <Folder className="w-4 h-4 text-amber-500" />
            )}
            <h3 className="text-sm font-semibold">
              {type === 'file' ? 'Create New File' : 'Create New Folder'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {parentPath ? (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Target folder:{' '}
              <span className="font-mono font-medium text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-blue-200 dark:border-slate-700">
                /{parentPath}/
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Target location:{' '}
              <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                Root directory
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {type === 'file' ? 'File Name (with extension)' : 'Folder Name'}
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder={type === 'file' ? 'e.g. main.cpp, script.py' : 'e.g. components, utils'}
              className="w-full px-3 py-2 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#181a1f] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Quick Extension Pills for Files */}
          {type === 'file' && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Quick extensions:
              </span>
              <div className="flex flex-wrap gap-1">
                {COMMON_EXTENSIONS.map(({ ext, label }) => (
                  <button
                    key={ext}
                    type="button"
                    onClick={() => appendExtension(ext)}
                    className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/40 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition"
                  >
                    {ext} <span className="text-slate-400 text-[9px]">({label})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1.5 rounded border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium rounded bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
            >
              Create {type === 'file' ? 'File' : 'Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
