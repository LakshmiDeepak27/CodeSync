import React, { useEffect, useRef } from 'react';
import { X, Trash2 } from 'lucide-react';

export function OutputPanel({ outputs = [], onClose, onClear }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputs]);

  return (
    <div className="h-60 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col w-full z-10 shrink-0 transition-colors duration-200">
      {/* Panel Header */}
      <div className="h-9 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
            Output Console
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            ({outputs.length} lines)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Clear Button */}
          <button
            onClick={onClear}
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Clear output"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
          {/* Close Panel Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Close panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1 custom-scrollbar bg-slate-50 dark:bg-slate-950 text-gray-800 dark:text-white transition-colors duration-200">
        {outputs.map((log, index) => {
          let typeColor = 'text-gray-700 dark:text-gray-200';
          let prefix = '❯ ';

          if (log.type === 'error') {
            typeColor = 'text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/20 px-2 py-1 rounded';
            prefix = '✘ ';
          } else if (log.type === 'warn') {
            typeColor = 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/20 px-2 py-1 rounded';
            prefix = '⚠ ';
          } else if (log.type === 'system') {
            typeColor = 'text-indigo-600 dark:text-indigo-400 italic';
            prefix = 'ℹ ';
          } else if (log.type === 'info') {
            typeColor = 'text-emerald-600 dark:text-emerald-400';
            prefix = '✦ ';
          }

          return (
            <div key={index} className={`whitespace-pre-wrap leading-relaxed ${typeColor}`}>
              <span className="opacity-50 select-none mr-1">{prefix}</span>
              {log.message}
            </div>
          );
        })}

        {outputs.length === 0 && (
          <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 italic select-none py-8">
            Console is empty. Click "Run" to execute code.
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
