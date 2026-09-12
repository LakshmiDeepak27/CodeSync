import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const LANGUAGES = [
  { id: 'cpp', name: 'C++ (GCC 9.2.0)', badge: 'C++', ext: 'cpp' },
  { id: 'c', name: 'C (GCC 9.2.0)', badge: 'C', ext: 'c' },
  { id: 'python', name: 'Python (3.8.1)', badge: 'PY', ext: 'py' },
  { id: 'javascript', name: 'JavaScript (Node.js)', badge: 'JS', ext: 'js' }
];

export function LanguageSelector({ selected = 'cpp', onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.id === selected || l.ext === selected) || LANGUAGES[0];

  return (
    <div className="relative select-none" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 transition-all"
        title="Switch Language"
      >
        <span className="font-bold text-[10px] px-1 py-0.2 bg-brand-500/10 text-brand-400 rounded">
          {currentLang.badge}
        </span>
        <span className="hidden sm:inline font-medium">{currentLang.name}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1.5 left-0 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg shadow-xl z-50 overflow-hidden py-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => {
                onChange(lang.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left transition font-mono ${
                currentLang.id === lang.id
                  ? 'bg-brand-500/10 text-brand-400 font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="w-6 text-center text-[10px] font-bold px-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {lang.badge}
              </span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
