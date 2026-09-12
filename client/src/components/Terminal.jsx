import React, { useState } from 'react';
import {
  Terminal as TerminalIcon,
  Play,
  Square,
  Copy,
  Trash2,
  Clock,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { EXECUTION_STATUS } from '@codesync/shared/constants';

export const Terminal = ({
  executionResult,
  isExecuting,
  executionState,
  stdin,
  onStdinChange,
  onClear
}) => {
  const [activeTab, setActiveTab] = useState('OUTPUT');
  const [copied, setCopied] = useState(false);

  const getStatusBadge = () => {
    if (isExecuting) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono bg-brand-500/20 text-brand-300 border border-brand-500/30">
          <Loader2 className="w-3 h-3 animate-spin" />
          {executionState || 'Running...'}
        </span>
      );
    }

    if (!executionResult) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-dark-800 text-dark-400 border border-dark-700">
          Ready
        </span>
      );
    }

    const { status, exitCode } = executionResult;

    if (status === EXECUTION_STATUS.COMPLETED && exitCode === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/30">
          <CheckCircle2 className="w-3 h-3" />
          Completed (0)
        </span>
      );
    }

    if (status === EXECUTION_STATUS.COMPILATION_ERROR) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-accent-rose/20 text-accent-rose border border-accent-rose/30">
          <XCircle className="w-3 h-3" />
          Compilation Error
        </span>
      );
    }

    if (status === EXECUTION_STATUS.TIME_LIMIT) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-accent-amber/20 text-accent-amber border border-accent-amber/30">
          <AlertTriangle className="w-3 h-3" />
          Time Limit Exceeded
        </span>
      );
    }

    if (status === EXECUTION_STATUS.RUNTIME_ERROR) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-accent-rose/20 text-accent-rose border border-accent-rose/30">
          <XCircle className="w-3 h-3" />
          Runtime Error ({exitCode})
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-dark-700 text-dark-300">
        {status || 'Finished'}
      </span>
    );
  };

  const handleCopy = () => {
    let textToCopy = '';
    if (activeTab === 'OUTPUT') textToCopy = executionResult?.stdout || '';
    if (activeTab === 'ERRORS') textToCopy = executionResult?.compileError || executionResult?.stderr || executionResult?.runtimeError || '';
    if (activeTab === 'INPUT') textToCopy = stdin;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const hasErrors = Boolean(
    executionResult?.compileError ||
    executionResult?.stderr ||
    executionResult?.runtimeError
  );

  return (
    <div className="h-full flex flex-col bg-[#0b0d10] border-t border-dark-700 text-xs font-mono">
      {/* Terminal Top Bar */}
      <div className="h-9 px-2 sm:px-3 border-b border-dark-750 flex items-center justify-between bg-dark-900 select-none overflow-hidden">
        {/* Left: Tabs */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('OUTPUT')}
            className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-wider transition ${
              activeTab === 'OUTPUT'
                ? 'bg-dark-800 text-dark-100 border-b-2 border-brand-400'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            OUTPUT
          </button>

          <button
            onClick={() => setActiveTab('INPUT')}
            className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-wider transition ${
              activeTab === 'INPUT'
                ? 'bg-dark-800 text-dark-100 border-b-2 border-brand-400'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            INPUT (STDIN)
          </button>

          <button
            onClick={() => setActiveTab('ERRORS')}
            className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-wider flex items-center gap-1.5 transition ${
              activeTab === 'ERRORS'
                ? 'bg-dark-800 text-dark-100 border-b-2 border-brand-400'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            ERRORS
            {hasErrors && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent-rose"></span>
            )}
          </button>
        </div>

        {/* Right: Status & Stats */}
        <div className="flex items-center space-x-3">
          {executionResult && (
            <div className="hidden sm:flex items-center space-x-2 text-dark-400 text-xs">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-dark-500" />
                {Math.round(executionResult.executionTime * 1000)}ms
              </span>
              {executionResult.memoryUsed > 0 && (
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-dark-500" />
                  {executionResult.memoryUsed} KB
                </span>
              )}
            </div>
          )}

          {getStatusBadge()}

          <div className="flex items-center space-x-1 border-l border-dark-750 pl-2">
            <button
              onClick={handleCopy}
              title="Copy Output"
              className="p-1 text-dark-400 hover:text-dark-100 hover:bg-dark-800 rounded transition"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClear}
              title="Clear Terminal"
              className="p-1 text-dark-400 hover:text-dark-100 hover:bg-dark-800 rounded transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 overflow-auto p-3 text-xs leading-relaxed font-mono">
        {activeTab === 'OUTPUT' && (
          <div>
            {isExecuting ? (
              <div className="text-dark-400 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                <span>{executionState || 'Executing program...'}</span>
              </div>
            ) : executionResult?.stdout ? (
              <pre className="text-dark-100 whitespace-pre-wrap selection:bg-brand-500/30">
                {executionResult.stdout}
              </pre>
            ) : executionResult ? (
              <div className="text-dark-400 italic">Program produced no standard output.</div>
            ) : (
              <div className="text-dark-500">Click "Run Code" or press Ctrl+Enter to execute.</div>
            )}
          </div>
        )}

        {activeTab === 'INPUT' && (
          <div className="h-full flex flex-col">
            <label className="text-dark-400 text-xs mb-1.5 font-sans">
              Standard input to pass to the program (e.g. arguments or test cases):
            </label>
            <textarea
              value={stdin}
              onChange={(e) => onStdinChange(e.target.value)}
              placeholder="Enter stdin here (e.g. 5 10)..."
              className="flex-1 w-full bg-dark-900 border border-dark-750 rounded p-2.5 text-xs font-mono text-dark-100 placeholder-dark-500 focus:border-brand-500 focus:outline-none resize-none"
            />
          </div>
        )}

        {activeTab === 'ERRORS' && (
          <div>
            {executionResult?.compileError ? (
              <div>
                <div className="text-accent-rose font-bold mb-1">Compilation Errors:</div>
                <pre className="text-accent-rose/90 whitespace-pre-wrap bg-accent-rose/5 p-2 rounded border border-accent-rose/20">
                  {executionResult.compileError}
                </pre>
              </div>
            ) : executionResult?.runtimeError || executionResult?.stderr ? (
              <div>
                <div className="text-accent-rose font-bold mb-1">Runtime Output / Errors:</div>
                <pre className="text-accent-rose/90 whitespace-pre-wrap bg-accent-rose/5 p-2 rounded border border-accent-rose/20">
                  {executionResult.runtimeError || executionResult.stderr}
                </pre>
              </div>
            ) : (
              <div className="text-dark-500">No errors recorded.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
