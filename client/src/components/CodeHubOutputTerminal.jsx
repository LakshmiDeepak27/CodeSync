import React, { useState, useRef, useEffect } from 'react';
import { Check, AlertTriangle, XCircle, Clock, Cpu, X, Trash2, Terminal as TerminalIcon, ChevronDown, ChevronUp } from 'lucide-react';

export function CodeHubOutputTerminal({
  output = '',
  error = '',
  isLoading = false,
  execMeta = null,
  stdin = '',
  onStdinChange,
  onClear,
  onClose
}) {
  const bottomRef = useRef(null);
  const [showStdin, setShowStdin] = useState(false);
  const [height, setHeight] = useState(() => {
    const saved = Number(localStorage.getItem('codesync-terminal-height'));
    return saved >= 180 && saved <= 680 ? saved : 280;
  });
  const resizingRef = useRef(false);

  useEffect(() => {
    if (output || error) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output, error, isLoading]);

  useEffect(() => {
    const handleMove = (event) => {
      if (!resizingRef.current) return;
      const next = Math.max(180, Math.min(680, window.innerHeight - event.clientY - 24));
      setHeight(next);
    };
    const handleUp = () => {
      if (!resizingRef.current) return;
      resizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => { window.removeEventListener('pointermove', handleMove); window.removeEventListener('pointerup', handleUp); };
  }, []);

  useEffect(() => { localStorage.setItem('codesync-terminal-height', String(height)); }, [height]);

  const hasOutput = output || error;
  const hasError = !!error;
  const exitedClean = execMeta?.exitCode === 0;

  return (
    <section style={{ height }} className="relative flex w-full flex-col overflow-hidden border-t border-[#262b33] bg-[#111318] select-none">
      <div
        role="separator"
        aria-label="Resize output panel"
        aria-orientation="horizontal"
        onPointerDown={(event) => { event.preventDefault(); resizingRef.current = true; document.body.style.cursor = 'row-resize'; document.body.style.userSelect = 'none'; }}
        className="group absolute inset-x-0 top-0 z-20 flex h-2 -translate-y-1/2 cursor-row-resize items-center justify-center"
      >
        <span className="h-px w-10 bg-slate-600 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#262b33] bg-[#181b21] px-3 sm:px-4">
        <div className="flex h-full items-center gap-3">
          <div className="flex h-full items-center gap-2 border-b-2 border-[#59c9f5] px-1 text-sm font-medium text-slate-100">
            <TerminalIcon className="h-4 w-4 text-[#59c9f5]" />
            Console
          </div>
          <span className="hidden font-mono text-[10px] text-slate-500 sm:inline">Ctrl+Enter to run</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-wider">
            {isLoading ? (
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="h-2 w-2 rounded-full border-2 border-amber-300/30 border-t-amber-300 animate-spin" />
                Running
              </span>
            ) : hasOutput ? (
              <span className={`flex items-center gap-1.5 ${hasError && !output ? 'text-rose-300' : 'text-emerald-300'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${hasError && !output ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                {hasError && !output ? 'Error' : 'Accepted'}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                Ready
              </span>
            )}
          </div>

          {/* Stdin Toggle Button */}
          {onStdinChange && (
            <button
              onClick={() => setShowStdin(!showStdin)}
              className={`flex items-center gap-1 border px-2 py-1 text-[11px] transition ${
                showStdin || stdin
                  ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Custom input (stdin)"
            >
              <TerminalIcon className="w-3 h-3" />
              <span>Input</span>
              {showStdin ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          {/* Clear Button */}
          {onClear && (
            <button
              onClick={onClear}
              className="p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
              title="Clear Terminal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
              title="Close Panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Stdin Drawer */}
      {showStdin && onStdinChange && (
        <div className="shrink-0 border-b border-[#262b33] bg-[#15181e] p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
              Standard Input (stdin)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Passed to program at runtime
            </span>
          </div>
          <textarea
            value={stdin}
            onChange={(e) => onStdinChange(e.target.value)}
            placeholder="Type standard input here (e.g. for std::cin or input())..."
            rows={2}
            className="w-full resize-none border border-[#303640] bg-[#0d0f13] p-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-[#59c9f5] focus:outline-none"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-[#111318] font-mono text-xs custom-scrollbar">
        {isLoading ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-8">
            <div className="flex h-10 w-10 items-center justify-center border border-amber-300/30 bg-amber-300/5">
              <span className="h-4 w-4 rounded-full border-2 border-amber-300/20 border-t-amber-300 animate-spin" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-200">Running your code</p>
            <p className="mt-1 text-center text-[11px] text-slate-500">Waiting for the execution service to return a result.</p>
            <div className="mt-5 h-1 w-48 overflow-hidden bg-[#282d35]"><span className="block h-full w-2/5 animate-pulse bg-[#59c9f5]" /></div>
          </div>
        ) : error && !output ? (
          <div className="p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-rose-300">
              <XCircle className="w-3 h-3" />
              <span>Runtime error</span>
            </div>
            <pre className="whitespace-pre-wrap border border-rose-900/40 bg-[#1a1115] p-3 leading-relaxed text-rose-300">
              {error}
            </pre>
          </div>
        ) : output && error ? (
          <div className="divide-y divide-[#262b33]">
            <div className="p-4">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                <Check className="w-3 h-3" />
                <span>STDOUT</span>
              </div>
              <pre className="whitespace-pre-wrap border border-[#303640] bg-[#0d0f13] p-3 leading-relaxed text-slate-200">
                {output}
              </pre>
            </div>
            <div className="p-4">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                <AlertTriangle className="w-3 h-3" />
                <span>STDERR</span>
              </div>
              <pre className="whitespace-pre-wrap border border-amber-900/40 bg-[#19150e] p-3 leading-relaxed text-amber-200">
                {error}
              </pre>
            </div>
          </div>
        ) : output ? (
          <div className="p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
              <Check className="w-3 h-3" />
              <span>STDOUT</span>
            </div>
            <pre className="whitespace-pre-wrap border border-[#303640] bg-[#0d0f13] p-3 leading-relaxed text-slate-100">
              {output}
            </pre>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-8 text-xs text-slate-500">
            <div className="flex h-10 w-10 items-center justify-center border border-[#303640] bg-[#181b21] text-slate-400">
              &gt;_
            </div>
            <p className="text-xs font-medium text-slate-300">No output yet</p>
            <p className="text-[11px] text-slate-500">
              Click <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">▶ RUN</kbd> or press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">Ctrl+Enter</kbd> to execute
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

          {execMeta && !isLoading && hasOutput && (
        <div className="flex h-8 shrink-0 items-center gap-4 border-t border-[#262b33] bg-[#181b21] px-4 font-mono text-[10px] text-slate-400 select-none">
          {execMeta.language && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              {execMeta.language}
            </span>
          )}
          {execMeta.time && (
            <span className="flex items-center gap-1 text-slate-300">
              <Clock className="w-3 h-3 text-slate-500" />
              {execMeta.time}s
            </span>
          )}
          {execMeta.memory && (
            <span className="flex items-center gap-1 text-slate-300">
              <Cpu className="w-3 h-3 text-slate-500" />
              {(execMeta.memory / 1024).toFixed(1)} MB
            </span>
          )}
          {execMeta.exitCode !== undefined && execMeta.exitCode !== null && (
            <span
              className={`px-1.5 py-0.5 rounded font-bold ${
                exitedClean ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              exit {execMeta.exitCode}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
