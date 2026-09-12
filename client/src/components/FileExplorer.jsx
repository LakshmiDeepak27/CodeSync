import React, { useState } from 'react';
import {
  FileCode,
  FilePlus,
  Trash2,
  Edit2,
  Check,
  X,
  FileText,
  FolderTree,
  Users
} from 'lucide-react';

const getFileBadge = (name) => {
  const ext = name.split('.').pop().toLowerCase();
  switch (ext) {
    case 'cpp':
    case 'cc':
    case 'cxx':
      return <span className="text-accent-cyan font-bold text-[9px] font-mono bg-accent-cyan/10 px-1 py-0.5 rounded leading-none shrink-0">CPP</span>;
    case 'c':
      return <span className="text-brand-400 font-bold text-[9px] font-mono bg-brand-500/10 px-1 py-0.5 rounded leading-none shrink-0">C</span>;
    case 'h':
    case 'hpp':
      return <span className="text-accent-amber font-bold text-[9px] font-mono bg-accent-amber/10 px-1 py-0.5 rounded leading-none shrink-0">H</span>;
    case 'py':
      return <span className="text-accent-emerald font-bold text-[9px] font-mono bg-accent-emerald/10 px-1 py-0.5 rounded leading-none shrink-0">PY</span>;
    case 'js':
    case 'jsx':
      return <span className="text-yellow-400 font-bold text-[9px] font-mono bg-yellow-400/10 px-1 py-0.5 rounded leading-none shrink-0">JS</span>;
    case 'json':
      return <span className="text-accent-purple font-bold text-[9px] font-mono bg-accent-purple/10 px-1 py-0.5 rounded leading-none shrink-0">JSON</span>;
    default:
      return <span className="text-dark-400 font-bold text-[9px] font-mono bg-dark-750 px-1 py-0.5 rounded leading-none shrink-0">TXT</span>;
  }
};

export const FileExplorer = ({
  files = [],
  activeFileId,
  onSelectFile,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
  canEdit = true,
  collaborators = [],
  currentUserId
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFileId, setEditingFileId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = newFileName.trim();
    if (!trimmed) return;

    try {
      setError('');
      await onCreateFile(trimmed);
      setNewFileName('');
      setIsCreating(false);
    } catch (err) {
      setError(err.message || 'Failed to create file');
    }
  };

  const handleRename = async (fileId) => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setEditingFileId(null);
      return;
    }

    try {
      setError('');
      await onRenameFile(fileId, trimmed);
      setEditingFileId(null);
    } catch (err) {
      setError(err.message || 'Failed to rename file');
    }
  };

  return (
    <div className="h-full flex flex-col bg-dark-950 select-none border-r border-dark-750">
      {/* Explorer Header */}
      <div className="h-10 px-3 border-b border-dark-750 flex items-center justify-between text-dark-300">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-dark-400">
          <FolderTree className="w-3.5 h-3.5 text-accent-cyan" />
          Workspace
        </span>

        {canEdit && (
          <button
            onClick={() => {
              setIsCreating(true);
              setNewFileName('');
            }}
            title="Create New File"
            className="p-1 rounded hover:bg-dark-800 text-dark-400 hover:text-dark-100 transition"
          >
            <FilePlus className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <div className="px-3 py-1.5 bg-accent-rose/10 border-b border-accent-rose/20 text-accent-rose text-xs truncate">
          {error}
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {/* Inline New File Input */}
        {isCreating && (
          <form onSubmit={handleCreate} className="flex items-center space-x-1.5 px-2 py-1.5 bg-dark-850 border border-brand-500 rounded-md">
            <span className="text-[10px] font-mono text-brand-400 font-bold">+</span>
            <input
              type="text"
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename.cpp"
              className="w-full bg-transparent text-xs text-dark-100 focus:outline-none font-mono"
            />
            <button type="submit" className="text-accent-emerald hover:text-white">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-dark-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {files.map((file) => {
          const isActive = file.id === activeFileId;
          const isEditing = editingFileId === file.id;

          return (
            <div
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-mono cursor-pointer transition border ${
                isActive
                  ? 'bg-brand-500/10 text-white font-medium border-brand-500/30'
                  : 'text-dark-400 hover:bg-dark-850 hover:text-dark-200 border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2 truncate flex-1 mr-1">
                {getFileBadge(file.name)}
                {isEditing ? (
                  <input
                    type="text"
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(file.id);
                      if (e.key === 'Escape') setEditingFileId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-dark-900 text-dark-100 px-1 py-0.5 rounded border border-brand-500 focus:outline-none text-xs"
                  />
                ) : (
                  <span className="truncate">{file.name}</span>
                )}
              </div>

              {/* Actions (Rename / Delete) */}
              {canEdit && !isEditing && (
                <div className="hidden group-hover:flex items-center space-x-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingFileId(file.id);
                      setRenameValue(file.name);
                    }}
                    title="Rename"
                    className="p-1 hover:bg-dark-750 text-dark-400 hover:text-dark-200 rounded"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>

                  {files.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete file "${file.name}"?`)) {
                          onDeleteFile(file.id);
                        }
                      }}
                      title="Delete"
                      className="p-1 hover:bg-accent-rose/20 text-dark-400 hover:text-accent-rose rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resonyx Reference: Active Coders Section */}
      <div className="border-t border-dark-750 p-3 bg-dark-900/60 shrink-0">
        <div className="flex items-center justify-between text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-accent-emerald" />
            Active Coders
          </span>
          <span className="text-[10px] text-accent-emerald font-mono font-bold bg-accent-emerald/10 px-1.5 py-0.5 rounded">
            {collaborators.length} online
          </span>
        </div>

        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {collaborators.map((c, i) => {
            const isMe = c.userId === currentUserId;
            const activeFileName = files.find((f) => f.id === c.fileId)?.name || 'main.cpp';

            return (
              <div
                key={c.socketId || i}
                className="flex items-center gap-2 px-2 py-1.5 rounded bg-dark-850 border border-dark-750/80"
              >
                <div className="relative shrink-0">
                  <div
                    style={{ backgroundColor: c.color || '#38bdf8' }}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-dark-950 uppercase"
                  >
                    {(c.name || c.username || 'U')[0]}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent-emerald ring-1 ring-dark-900" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-dark-100 truncate">
                      {c.name || c.username}
                    </span>
                    {isMe && (
                      <span className="text-[9px] text-brand-400 bg-brand-500/10 px-1 rounded">
                        you
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-dark-400 truncate font-mono">
                    editing: {activeFileName}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
