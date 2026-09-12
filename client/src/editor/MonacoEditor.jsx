import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

export const MonacoEditor = ({
  file,
  onContentChange,
  readOnly = false,
  collaboratorCursors = [],
  onCursorChange,
  onExecuteShortcut
}) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const isApplyingRemoteRef = useRef(false);

  // Configure editor settings and theme
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom dark theme
    monaco.editor.defineTheme('codesync-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7b72' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'type', foreground: 'ffa657' }
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#c9d1d9',
        'editor.lineHighlightBackground': '#161b2255',
        'editorCursor.foreground': '#58a6ff',
        'editorWhitespace.foreground': '#21262d',
        'editorIndentGuide.background': '#21262d',
        'editorIndentGuide.activeBackground': '#30363d',
        'editorLineNumber.foreground': '#484f58',
        'editorLineNumber.activeForeground': '#c9d1d9'
      }
    });

    monaco.editor.setTheme('codesync-dark');

    // Setup Ctrl+Enter or Cmd+Enter shortcut to run code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onExecuteShortcut) {
        onExecuteShortcut();
      }
    });

    // Listen for local cursor movement
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange({
          line: e.position.lineNumber,
          column: e.position.column
        });
      }
    });

    editor.onDidChangeCursorSelection((e) => {
      if (onCursorChange) {
        onCursorChange({
          line: e.selection.positionLineNumber,
          column: e.selection.positionColumn,
          selection: {
            startLine: e.selection.startLineNumber,
            startColumn: e.selection.startColumn,
            endLine: e.selection.endLineNumber,
            endColumn: e.selection.endColumn
          }
        });
      }
    });
  };

  const handleEditorChange = (value, ev) => {
    if (isApplyingRemoteRef.current) return;
    if (onContentChange) {
      onContentChange(value, ev?.changes || []);
    }
  };

  // Render remote collaborator cursors and selections
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !file) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    // Filter cursors for the currently active file
    const activeFileCursors = collaboratorCursors.filter((c) => c.fileId === file.id);

    const newDecorations = [];

    activeFileCursors.forEach((c) => {
      // 1. Cursor line decoration
      newDecorations.push({
        range: new monaco.Range(c.line, c.column, c.line, c.column),
        options: {
          className: `remote-caret-${c.userId}`,
          beforeContentClassName: `remote-caret-flag-${c.userId}`,
          hoverMessage: { value: `**${c.name || c.username}** editing` }
        }
      });

      // Inject dynamic CSS class for this user's cursor color if needed
      const styleId = `cursor-style-${c.userId}`;
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          .remote-caret-${c.userId} {
            border-left: 2px solid ${c.color} !important;
            margin-left: -1px;
          }
          .remote-caret-flag-${c.userId}::before {
            content: "${c.name || c.username}";
            position: absolute;
            top: -16px;
            left: -2px;
            font-size: 9px;
            font-weight: 600;
            padding: 0 4px;
            border-radius: 2px;
            background: ${c.color};
            color: #0d1117;
            white-space: nowrap;
            pointer-events: none;
            z-index: 10;
          }
        `;
        document.head.appendChild(style);
      }

      // 2. Selection range decoration if active
      if (c.selection && (c.selection.startLine !== c.selection.endLine || c.selection.startColumn !== c.selection.endColumn)) {
        newDecorations.push({
          range: new monaco.Range(
            c.selection.startLine,
            c.selection.startColumn,
            c.selection.endLine,
            c.selection.endColumn
          ),
          options: {
            className: `remote-selection-${c.userId}`
          }
        });

        const selStyleId = `selection-style-${c.userId}`;
        if (!document.getElementById(selStyleId)) {
          const style = document.createElement('style');
          style.id = selStyleId;
          style.innerHTML = `
            .remote-selection-${c.userId} {
              background-color: ${c.color}33 !important;
            }
          `;
          document.head.appendChild(style);
        }
      }
    });

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [collaboratorCursors, file]);

  return (
    <div className="h-full w-full relative overflow-hidden bg-dark-900">
      <Editor
        height="100%"
        theme="codesync-dark"
        language={file?.language || 'cpp'}
        value={file?.content || ''}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          fontLigatures: true,
          minimap: { enabled: true, maxColumn: 80 },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          smoothScrolling: true,
          tabSize: 4,
          insertSpaces: true,
          lineNumbers: 'on',
          bracketPairColorization: { enabled: true },
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'all',
          wordWrap: 'on'
        }}
      />
    </div>
  );
};
