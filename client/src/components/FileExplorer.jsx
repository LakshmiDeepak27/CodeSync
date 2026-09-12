import React, { useState } from 'react';
import {
  FileCode,
  FilePlus,
  Trash2,
  Edit2,
  Check,
  X,
  FileText,
  FolderTree
} from 'lucide-react';

export const FileExplorer = ({
  files = [],
  activeFileId,
  onSelectFile,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
  canEdit = true
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFileId, setEditingFileId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [error, setError] = useState('');

  const getFileIcon = (name) => {
    if (name.endsWith('.cpp') || name.endsWith('.cc') || name.endsWith('.c')) {
      return <FileCode className="w-4 h-4 text-accent-cyan" />;
    }
    if (name.endsWith('.h') || name.endsWith('.hpp')) {
      return <FileCode className="w-4 h-4 text-accent-amber" />;
    }
    if (name.endsWith('.py')) {
      return <FileCode className="w-4 h-4 text-accent-emerald" />;
    }
    return <FileText className="w-4 h-4 text-dark-400" />;
  };

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
    <div className="h-full flex flex-col bg-dark-950 border-r border-dark-700 select-none">
      {/* Explorer Header */}
      <div className="h-9 px-3 border-b border-dark-750 flex items-center justify-between text-xs font-semibold text-dark-400 uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <FolderTree className="w-3.5 h-3.5 text-dark-400" />
          Files
        </span>

        {canEdit && (
          <button
            onClick={() => {
              setIsCreating(true);
              setNewFileName('');
            }}
            title="New File"
            className="p-1 hover:bg-dark-800 text-dark-400 hover:text-dark-100 rounded transition"
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
      <div className="flex-1 overflow-y-auto py-1 px-1.5 space-y-0.5">
        {/* Inline New File Input */}
        {isCreating && (
          <form onSubmit={handleCreate} className="flex items-center space-x-1.5 px-2 py-1 bg-dark-800 rounded border border-brand-500/50">
            <FileCode className="w-4 h-4 text-brand-400 shrink-0" />
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
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-mono cursor-pointer transition ${
                isActive
                  ? 'bg-dark-800 text-dark-100 font-medium border border-dark-600/60 shadow-sm'
                  : 'text-dark-400 hover:bg-dark-850 hover:text-dark-200'
              }`}
            >
              <div className="flex items-center space-x-2 truncate flex-1 mr-1">
                {getFileIcon(file.name)}
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
                    className="w-full bg-dark-900 text-dark-100 px-1 py-0.5 rounded border border-brand-500 focus:outline-none"
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
                    className="p-1 hover:bg-dark-700 text-dark-400 hover:text-dark-200 rounded"
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
    </div>
  );
};
