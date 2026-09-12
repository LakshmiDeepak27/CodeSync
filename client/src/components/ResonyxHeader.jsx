import React from 'react';
import { ChevronRight, LogOut, MessageSquare, Moon, Play, Share2, Sun, Loader2, Terminal } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector.jsx';
import { Avatar } from './Avatar.jsx';
import { BrandMark } from './BrandMark.jsx';

export function ResonyxHeader({
  language,
  onLanguageChange,
  onRun,
  isRunning,
  onToggleTerminal,
  showTerminal,
  onFontDecrease,
  onFontIncrease,
  fontSize,
  onLogout,
  isConnected,
  theme,
  onToggleTheme,
  roomTitle,
  activeFile,
  users = [],
  onShare,
  onToggleChat,
  showChat,
  unreadCount = 0
}) {
  const visibleUsers = users.slice(0, 3);

  return (
    <header className="h-16 w-full shrink-0 border-b border-[#d8d8d8] bg-[#f5f6f8] px-3 text-slate-700 dark:border-slate-800 dark:bg-[#1e2227] dark:text-slate-200 sm:px-4 select-none">
      <div className="flex h-full min-w-0 items-center gap-3">
        {/* Brand */}
        <div className="flex shrink-0 items-center gap-2 pr-2 sm:pr-3">
          <BrandMark size={28} />
          <span className="hidden text-base font-bold tracking-tight text-slate-900 dark:text-white sm:inline">
            CodeSync
          </span>
        </div>

        {/* Room / Active File Breadcrumb */}
      <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-md border border-[#d8dce2] bg-white px-2.5 py-1.5 font-mono text-xs dark:border-slate-700 dark:bg-[#252a31] md:flex">
          <span className="truncate font-semibold text-slate-700 dark:text-slate-200">{roomTitle || 'Workspace'}</span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate text-blue-600 dark:text-cyan-400 font-bold">{activeFile || 'main.cpp'}</span>
        </div>

        {/* Right Toolbar Actions */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* Active Collaborators */}
          {users.length > 0 && (
            <div className="hidden items-center -space-x-1.5 pr-1 lg:flex">
              {visibleUsers.map((user, index) => (
                <span key={user.username || index} className="rounded-full ring-2 ring-[#f5f6f8] dark:ring-[#1e2227]">
                  <Avatar username={user.username} size={24} />
                </span>
              ))}
            </div>
          )}

          {/* Sync Status Badge */}
          <span
            title={isConnected ? 'Connected' : 'Connecting'}
            className={`hidden h-7 w-7 items-center justify-center rounded-full border sm:flex ${
              isConnected
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
            }`}
          >
            <i className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
          </span>

          {/* Run Button (Judge0 execution) */}
          <button
            onClick={onRun}
            disabled={isRunning}
            title="Run program (Ctrl+Enter)"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#2ea44f] px-3.5 text-xs font-bold text-white transition hover:bg-[#298e46] disabled:opacity-55 shadow-sm"
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
            <span>{isRunning ? 'Running' : 'Run'}</span>
          </button>

          {/* Terminal Toggle Button (Prominent right beside Run) */}
          <button
            onClick={onToggleTerminal}
            title="Toggle Output Terminal"
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-xs font-semibold transition ${
              showTerminal
                ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                : 'border-[#d8dce2] bg-white hover:bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-[#252a31] dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Terminal className="h-3.5 w-3.5 text-[#84dfff]" />
          </button>

          {/* Language Selector */}
          {onLanguageChange && (
            <div className="hidden lg:block">
              <LanguageSelector selected={language} onChange={onLanguageChange} />
            </div>
          )}


          {/* Chat Drawer Toggle */}
          {onToggleChat && (
            <button
              onClick={onToggleChat}
              title="Room chat"
              className={`relative flex h-9 items-center gap-2 rounded-md border px-2.5 text-xs font-medium transition ${
                showChat
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-[#d8dce2] bg-white hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
              {unreadCount > 0 && !showChat && (
                <i className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] not-italic text-white">
                  {unreadCount}
                </i>
              )}
            </button>
          )}

          {/* Share Room Button */}
          {onShare && (
            <button onClick={onShare} title="Share room code" className="header-icon-button">
              <Share2 className="h-4 w-4" />
            </button>
          )}

          {/* Light/Dark Theme Toggle */}
          <button onClick={onToggleTheme} title="Toggle theme" className="header-icon-button">
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Exit to Dashboard */}
          <button onClick={onLogout} title="Exit to dashboard" className="header-icon-button text-rose-500 hover:text-rose-400">
            <LogOut className="h-4 w-4" />
            <span className="hidden xl:inline text-xs font-semibold">Exit</span>
          </button>
        </div>
      </div>
    </header>
  );
}
