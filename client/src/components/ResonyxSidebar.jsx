import React, { useState, useEffect, useMemo } from 'react';
import * as Y from 'yjs';
import {
  Folder,
  FolderOpen,
  File,
  FilePlus,
  FolderPlus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Users,
  Upload,
  UserPlus,
  UserCheck,
  Check
} from 'lucide-react';
import { Avatar } from './Avatar.jsx';

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'cpp':
    case 'cc':
    case 'cxx':
      return (
        <span className="text-cyan-400 font-bold text-[9px] font-mono select-none mr-1.5 bg-cyan-400/10 px-1 py-0.5 rounded leading-none shrink-0">
          CPP
        </span>
      );
    case 'c':
      return (
        <span className="text-sky-400 font-bold text-[9px] font-mono select-none mr-1.5 bg-sky-400/10 px-1 py-0.5 rounded leading-none shrink-0">
          C
        </span>
      );
    case 'py':
      return (
        <span className="text-emerald-400 font-bold text-[9px] font-mono select-none mr-1.5 bg-emerald-400/10 px-1 py-0.5 rounded leading-none shrink-0">
          PY
        </span>
      );
    case 'js':
    case 'jsx':
      return (
        <span className="text-yellow-500 font-bold text-[10px] font-mono select-none mr-1.5 bg-yellow-500/10 px-1 py-0.5 rounded leading-none shrink-0">
          JS
        </span>
      );
    case 'ts':
    case 'tsx':
      return (
        <span className="text-blue-500 font-bold text-[10px] font-mono select-none mr-1.5 bg-blue-500/10 px-1 py-0.5 rounded leading-none shrink-0">
          TS
        </span>
      );
    case 'html':
      return (
        <span className="text-orange-500 font-bold text-[9px] font-mono select-none mr-1.5 bg-orange-500/10 px-1.5 py-0.5 rounded leading-none shrink-0">
          HTML
        </span>
      );
    case 'css':
      return (
        <span className="text-teal-400 font-bold text-[9px] font-mono select-none mr-1.5 bg-teal-500/10 px-1.5 py-0.5 rounded leading-none shrink-0">
          CSS
        </span>
      );
    case 'json':
      return (
        <span className="text-purple-400 font-bold text-[9px] font-mono select-none mr-1.5 bg-purple-500/10 px-1.5 py-0.5 rounded leading-none shrink-0">
          JSON
        </span>
      );
    case 'md':
      return (
        <span className="text-slate-400 font-bold text-[9px] font-mono select-none mr-1.5 bg-slate-500/10 px-1.5 py-0.5 rounded leading-none shrink-0">
          MD
        </span>
      );
    default:
      return <File className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />;
  }
};

const buildTree = (files, folders) => {
  const root = { name: 'Root', type: 'folder', children: {}, path: '' };

  // Add folders
  folders.forEach((folderPath) => {
    const parts = folderPath.split('/').filter(Boolean);
    let current = root;
    let pathAcc = '';
    parts.forEach((part) => {
      pathAcc = pathAcc ? `${pathAcc}/${part}` : part;
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          type: 'folder',
          children: {},
          path: pathAcc
        };
      }
      current = current.children[part];
    });
  });

  // Add files
  files.forEach((filePath) => {
    const parts = filePath.split('/').filter(Boolean);
    let current = root;
    let pathAcc = '';
    parts.forEach((part, index) => {
      pathAcc = pathAcc ? `${pathAcc}/${part}` : part;
      if (index === parts.length - 1) {
        current.children[part] = { name: part, type: 'file', path: pathAcc };
      } else {
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            type: 'folder',
            children: {},
            path: pathAcc
          };
        }
        current = current.children[part];
      }
    });
  });

  const convertToArray = (node) => {
    if (node.type === 'file') return node;
    const sortedChildren = Object.values(node.children).sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    return {
      ...node,
      children: sortedChildren.map(convertToArray)
    };
  };

  return convertToArray(root).children;
};

export function ResonyxSidebar({
  users = [],
  currentUser = '',
  yFiles,
  yFolders,
  activeFile,
  onSelectFile,
  roomTitle = 'Workspace',
  width = 240,
  onUploadFile,
  onUploadFolder,
  onPromptNewFile,
  onPromptNewFolder,
  friendsList = [],
  sentRequests = [],
  onSendFriendRequest
}) {
  const [dragOverFolder, setDragOverFolder] = useState(null);

  const validUsers = useMemo(() => {
    const userMap = new Map();
    users.forEach((u) => {
      if (u && u.username) {
        const existing = userMap.get(u.username);
        if (!existing || (!existing.activeFile && u.activeFile)) {
          userMap.set(u.username, u);
        }
      }
    });
    return Array.from(userMap.values());
  }, [users]);

  const [filesList, setFilesList] = useState([]);
  const [foldersList, setFoldersList] = useState([]);
  const [collapsedFolders, setCollapsedFolders] = useState({});
  const [creating, setCreating] = useState(null);
  const [collaboratorsHeight, setCollaboratorsHeight] = useState(() => Number(localStorage.getItem('codesync-collaborators-height')) || 160);
  const resizingCollaboratorsRef = React.useRef(false);

  useEffect(() => {
    const onMove = (event) => { if (resizingCollaboratorsRef.current) setCollaboratorsHeight(Math.max(100, Math.min(360, window.innerHeight - event.clientY - 24))); };
    const onUp = () => { resizingCollaboratorsRef.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, []);
  useEffect(() => { localStorage.setItem('codesync-collaborators-height', String(collaboratorsHeight)); }, [collaboratorsHeight]);

  useEffect(() => {
    if (!yFiles || !yFolders) return;

    const updateLists = () => {
      setFilesList(Array.from(yFiles.keys()));
      setFoldersList(Array.from(yFolders.keys()));
    };

    updateLists();

    yFiles.observe(updateLists);
    yFolders.observe(updateLists);

    return () => {
      yFiles.unobserve(updateLists);
      yFolders.unobserve(updateLists);
    };
  }, [yFiles, yFolders]);

  const tree = useMemo(
    () => buildTree(filesList, foldersList),
    [filesList, foldersList]
  );

  const toggleFolder = (path) => {
    setCollapsedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const startCreate = (type, parentPath) => {
    if (type === 'file' && onPromptNewFile) {
      onPromptNewFile(parentPath);
      if (parentPath) {
        setCollapsedFolders((prev) => ({ ...prev, [parentPath]: false }));
      }
      return;
    }
    if (type === 'folder' && onPromptNewFolder) {
      onPromptNewFolder(parentPath);
      if (parentPath) {
        setCollapsedFolders((prev) => ({ ...prev, [parentPath]: false }));
      }
      return;
    }
    setCreating({ type, parentPath });
    if (parentPath) {
      setCollapsedFolders((prev) => ({ ...prev, [parentPath]: false }));
    }
  };

  const cancelCreate = () => {
    setCreating(null);
  };

  const submitCreate = (name) => {
    if (!name) return cancelCreate();

    const newPath = creating.parentPath
      ? `${creating.parentPath}/${name}`
      : name;

    if (creating.type === 'file') {
      if (!yFiles.has(newPath)) {
        const newText = new Y.Text();
        yFiles.set(newPath, newText);
        onSelectFile(newPath);
      }
    } else {
      if (!yFolders.has(newPath)) {
        yFolders.set(newPath, true);
      }
    }

    setCreating(null);
  };

  // Drag and Drop File into Folder
  const handleDropOnFolder = (e, targetFolder) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);

    const sourcePath = e.dataTransfer.getData('text/codesync-path');
    if (!sourcePath || !yFiles) return;

    // Don't drop folder into itself or if already in target folder
    if (sourcePath === targetFolder || sourcePath.startsWith(`${targetFolder}/`)) return;

    const baseName = sourcePath.split('/').pop();
    const newPath = `${targetFolder}/${baseName}`;
    if (sourcePath === newPath) return;

    const existingText = yFiles.get(sourcePath)?.toString() || '';
    const newText = new Y.Text();
    newText.insert(0, existingText);
    yFiles.set(newPath, newText);
    yFiles.delete(sourcePath);

    // Auto-expand folder
    setCollapsedFolders((prev) => ({ ...prev, [targetFolder]: false }));
    if (activeFile === sourcePath) {
      onSelectFile(newPath);
    }
  };

  const handleDeleteFile = (path) => {
    if (confirm(`Delete ${path}?`)) {
      yFiles.delete(path);
    }
  };

  const handleDeleteFolder = (folderPath) => {
    if (confirm(`Delete folder ${folderPath} and its contents?`)) {
      Array.from(yFiles.keys()).forEach((filePath) => {
        if (filePath.startsWith(`${folderPath}/`)) {
          yFiles.delete(filePath);
        }
      });
      Array.from(yFolders.keys()).forEach((fPath) => {
        if (fPath === folderPath || fPath.startsWith(`${folderPath}/`)) {
          yFolders.delete(fPath);
        }
      });
    }
  };

  const renderCreationInput = (depth) => {
    return (
      <div
        className="flex items-center gap-1.5 py-1 px-1 rounded bg-white dark:bg-slate-800 border border-blue-500 shadow-xs my-0.5"
        style={{ paddingLeft: `${depth * 12 + 10}px` }}
      >
        {creating.type === 'file' ? (
          <File className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        ) : (
          <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        )}
        <input
          autoFocus
          type="text"
          placeholder={creating.type === 'file' ? 'filename.cpp' : 'foldername'}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitCreate(e.target.value.trim());
            if (e.key === 'Escape') cancelCreate();
          }}
          onBlur={(e) => submitCreate(e.target.value.trim())}
          className="bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none w-full font-mono"
        />
      </div>
    );
  };

  const renderNode = (node, depth = 0) => {
    const isFolder = node.type === 'folder';
    const isCollapsed = collapsedFolders[node.path];
    const isActive = node.path === activeFile;
    const isDragOver = dragOverFolder === node.path;

    if (isFolder) {
      return (
        <div key={node.path} className="select-none">
          <div
            onClick={() => toggleFolder(node.path)}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOverFolder(node.path);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (dragOverFolder === node.path) setDragOverFolder(null);
            }}
            onDrop={(e) => handleDropOnFolder(e, node.path)}
            className={`flex items-center justify-between group py-1 px-1.5 rounded cursor-pointer transition-colors border ${
              isDragOver
                ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-500'
                : 'border-transparent hover:bg-slate-200/80 dark:hover:bg-slate-800/50'
            }`}
            style={{ paddingLeft: `${depth * 12 + 6}px` }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
              {isCollapsed ? (
                <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              ) : (
                <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )}
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate font-mono">
                {node.name}
              </span>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startCreate('file', node.path);
                }}
                title={`New file inside ${node.name}`}
                className="p-1 rounded hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
              >
                <FilePlus className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startCreate('folder', node.path);
                }}
                title={`New subfolder inside ${node.name}`}
                className="p-1 rounded hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(node.path);
                }}
                title="Delete Folder"
                className="p-1 rounded hover:bg-slate-300 dark:hover:bg-slate-700 text-rose-500 hover:text-rose-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isCollapsed && (
            <div>
              {creating &&
                creating.parentPath === node.path &&
                renderCreationInput(depth + 1)}
              {node.children.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    const editingUsers = validUsers.filter((u) => u.activeFile === node.path);

    return (
      <div
        key={node.path}
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/codesync-path', node.path);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onClick={() => onSelectFile(node.path)}
        className={`flex items-center justify-between group py-1.5 px-2 rounded cursor-grab active:cursor-grabbing transition-all my-0.5 border ${
          isActive
            ? 'bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-slate-700 text-blue-900 dark:text-white font-medium'
            : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-400'
        }`}
        style={{ paddingLeft: `${depth * 12 + 16}px` }}
      >
        <div className="grow flex items-center gap-1.5 min-w-0 mr-1.5">
          {getFileIcon(node.name)}
          <span className="text-[13px] truncate font-mono">{node.name}</span>
        </div>

        <div className="relative w-12 h-5 flex items-center justify-end shrink-0">
          {editingUsers.length > 0 && (
            <div className="flex items-center -space-x-1.5 absolute right-0 group-hover:opacity-0 transition-opacity">
              {editingUsers.map((user, idx) => (
                <div
                  key={`${user.username}-editing-${idx}`}
                  title={`${user.username} is editing this file`}
                >
                  <Avatar
                    username={user.username}
                    size={16}
                    className="rounded-full border border-white dark:border-slate-800"
                  />
                </div>
              ))}
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteFile(node.path);
            }}
            title="Delete File"
            className="absolute right-0 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500 hover:text-rose-600 transition-opacity"
          >
            <Trash2 className="w-4 h-4.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <aside
      style={{ width: `${width}px` }}
      className="bg-[#f8f9fa] dark:bg-[#181a1f] border-r border-[#d8d8d8] dark:border-slate-800 flex flex-col h-full shrink-0 select-none text-slate-700 dark:text-slate-300 font-sans relative"
    >
      {/* Workspace Header with File, Folder and Upload Actions */}
      <div className="px-3 py-2.5 border-b border-[#e2e2e2] dark:border-slate-800 flex items-center justify-between bg-[#f0f2f5] dark:bg-[#21252b]">
        <div className="flex items-center gap-1.5">
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          <h2 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 tracking-wide font-mono uppercase truncate max-w-[110px]">
            {roomTitle || 'Workspace'}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => startCreate('file', '')}
            title="New File (prompts name)"
            className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <FilePlus className="w-5 h-5" />
          </button>
          <button
            onClick={() => startCreate('folder', '')}
            title="New Folder"
            className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <FolderPlus className="w-5 h-5" />
          </button>
          {onUploadFile && (
            <button
              onClick={onUploadFile}
              title="Upload File"
              className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Upload className="w-5 h-5" />
            </button>
          )}
          {onUploadFolder && <button onClick={onUploadFolder} title="Upload Folder" className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><FolderOpen className="w-5 h-5" /></button>}
        </div>
      </div>

      {/* Tree Container */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(e) => {
          // If dropped directly on the container background (not on a folder node)
          if (e.target === e.currentTarget || e.target.classList?.contains('custom-scrollbar')) {
            e.preventDefault();
            const sourcePath = e.dataTransfer.getData('text/codesync-path');
            if (!sourcePath || !yFiles || !sourcePath.includes('/')) return;
            const baseName = sourcePath.split('/').pop();
            if (yFiles.has(baseName)) return; // Already exists at root

            const existingText = yFiles.get(sourcePath)?.toString() || '';
            const newText = new Y.Text();
            newText.insert(0, existingText);
            yFiles.set(baseName, newText);
            yFiles.delete(sourcePath);

            if (activeFile === sourcePath) {
              onSelectFile(baseName);
            }
          }
        }}
        className="flex-1 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar"
      >
        {creating && creating.parentPath === '' && renderCreationInput(0)}

        {tree.map((node) => renderNode(node, 0))}

        {tree.length === 0 && !creating && (
          <div className="text-center py-8 text-slate-400">
            <p className="text-[11px]">No files in workspace.</p>
          </div>
        )}
      </div>

      {/* Collaborators List Section */}
      <div style={{ height: collaboratorsHeight }} className="relative border-t border-[#e2e2e2] dark:border-slate-800 flex flex-col min-h-[100px] bg-[#f0f2f5]/60 dark:bg-[#1e2227]">
        <div onPointerDown={(event) => { event.preventDefault(); resizingCollaboratorsRef.current = true; document.body.style.cursor = 'row-resize'; document.body.style.userSelect = 'none'; }} title="Drag to resize collaborators" className="absolute -top-1 left-0 right-0 z-10 h-2 cursor-row-resize" />
        <div className="px-2.5 py-1.5 border-b border-[#e2e2e2] dark:border-slate-800 flex items-center justify-between shrink-0">
          <h2 className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Users className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
            <span>Collaborators ({validUsers.length})</span>
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
          {validUsers.map((u, index) => {
            const isSelf = u.username === currentUser;
            const isFriend = Array.isArray(friendsList) && friendsList.some((f) => (f.username || '').toLowerCase() === (u.username || '').toLowerCase());
            const isPending = Array.isArray(sentRequests) && sentRequests.includes((u.username || '').toLowerCase());

            return (
              <div
                key={`${u.username}-${index}`}
                className={`group flex items-center justify-between gap-2 px-2 py-1.5 rounded border text-xs transition-all ${
                  isSelf
                    ? 'bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium'
                    : 'bg-white/90 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Avatar username={u.username} size={20} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] truncate flex items-center gap-1 font-semibold">
                      <span className="truncate">{u.username}</span>
                      {isSelf && (
                        <span className="text-[8px] px-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-normal">
                          You
                        </span>
                      )}
                    </p>
                    {u.activeFile && (
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                        Editing: <span className="font-mono text-blue-600 dark:text-cyan-400">{u.activeFile}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Friend Request Action Button */}
                {!isSelf && (
                  <div className="shrink-0">
                    {isFriend ? (
                      <span
                        title="Already in your friends list"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800 text-[10px] font-medium"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span className="hidden sm:inline">Friend</span>
                      </span>
                    ) : isPending ? (
                      <span
                        title="Friend request sent"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800 text-[10px] font-medium"
                      >
                        <Check className="w-3 h-3" />
                        <span className="hidden sm:inline">Sent</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onSendFriendRequest && onSendFriendRequest(u.username)}
                        title={`Send friend request to @${u.username}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white dark:bg-cyan-600 dark:hover:bg-cyan-500 text-[10px] font-bold shadow-xs transition active:scale-95 cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
