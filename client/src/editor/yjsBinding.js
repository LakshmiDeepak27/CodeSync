import * as Y from 'yjs';

/**
 * FileYjsManager manages Yjs CRDT documents per file and synchronizes them with Monaco Editor models.
 */
export class FileYjsManager {
  constructor(socket, roomId, onSave) {
    this.socket = socket;
    this.roomId = roomId;
    this.onSave = onSave;
    this.docs = new Map(); // fileId -> { doc: Y.Doc, text: Y.Text, updateHandler: Function }
    this.activeBindings = new Map(); // fileId -> cleanup function
  }

  /**
   * Get existing or initialize a new Y.Doc with initial content
   */
  getOrCreateDoc(fileId, initialContent = '') {
    if (this.docs.has(fileId)) {
      return this.docs.get(fileId);
    }

    const doc = new Y.Doc();
    const text = doc.getText('codetext');

    if (initialContent) {
      doc.transact(() => {
        text.insert(0, initialContent);
      }, 'initial');
    }

    // Broadcast local binary updates over socket
    const updateHandler = (update, origin) => {
      if (origin !== 'remote' && this.socket && this.socket.connected) {
        this.socket.emit('yjs:update', {
          roomId: this.roomId,
          fileId,
          update: Array.from(update)
        });

        if (this.onSave) {
          this.onSave(fileId, text.toString());
        }
      }
    };

    doc.on('update', updateHandler);

    const docEntry = { doc, text, updateHandler };
    this.docs.set(fileId, docEntry);
    return docEntry;
  }

  /**
   * Apply a binary CRDT update from a remote peer
   */
  applyRemoteUpdate(fileId, rawUpdate) {
    const entry = this.docs.get(fileId);
    if (!entry) return;

    try {
      const updateArray = new Uint8Array(rawUpdate);
      Y.applyUpdate(entry.doc, updateArray, 'remote');
    } catch (err) {
      console.error('Failed to apply remote Yjs update:', err);
    }
  }

  /**
   * Bind the active Monaco editor model to the corresponding Y.Doc
   */
  bindModel(editor, monaco, fileId, initialContent = '') {
    this.unbindModel(fileId);

    const { doc, text } = this.getOrCreateDoc(fileId, initialContent);
    const model = editor.getModel();
    if (!model) return;

    // Synchronize initial text if model differs
    const currentYText = text.toString();
    if (model.getValue() !== currentYText && currentYText.length > 0) {
      model.setValue(currentYText);
    }

    let isRemote = false;

    // Monaco local change -> Yjs
    const monacoListener = model.onDidChangeContent((e) => {
      if (isRemote) return;

      doc.transact(() => {
        const sortedChanges = [...e.changes].sort((a, b) => b.rangeOffset - a.rangeOffset);
        for (const change of sortedChanges) {
          text.delete(change.rangeOffset, change.rangeLength);
          text.insert(change.rangeOffset, change.text);
        }
      }, 'local');
    });

    // Yjs remote change -> Monaco
    const ytextObserver = (event, transaction) => {
      if (transaction.origin === 'local') return;

      isRemote = true;
      try {
        let index = 0;
        const editOperations = [];

        for (const delta of event.delta) {
          if (delta.retain !== undefined) {
            index += delta.retain;
          } else if (delta.delete !== undefined) {
            const startPos = model.getPositionAt(index);
            const endPos = model.getPositionAt(index + delta.delete);
            editOperations.push({
              range: new monaco.Range(
                startPos.lineNumber,
                startPos.column,
                endPos.lineNumber,
                endPos.column
              ),
              text: '',
              forceMoveMarkers: true
            });
          } else if (delta.insert !== undefined) {
            const pos = model.getPositionAt(index);
            const insertText = typeof delta.insert === 'string' ? delta.insert : '';
            editOperations.push({
              range: new monaco.Range(
                pos.lineNumber,
                pos.column,
                pos.lineNumber,
                pos.column
              ),
              text: insertText,
              forceMoveMarkers: true
            });
            index += insertText.length;
          }
        }

        if (editOperations.length > 0) {
          model.pushEditOperations([], editOperations, () => null);
        }
      } catch (err) {
        console.error('Failed to sync Yjs delta into Monaco:', err);
      } finally {
        isRemote = false;
      }
    };

    text.observe(ytextObserver);

    const cleanup = () => {
      monacoListener.dispose();
      text.unobserve(ytextObserver);
    };

    this.activeBindings.set(fileId, cleanup);
    return cleanup;
  }

  unbindModel(fileId) {
    if (this.activeBindings.has(fileId)) {
      const cleanup = this.activeBindings.get(fileId);
      cleanup();
      this.activeBindings.delete(fileId);
    }
  }

  destroy() {
    this.activeBindings.forEach((cleanup) => cleanup());
    this.activeBindings.clear();
    this.docs.forEach((entry) => entry.doc.destroy());
    this.docs.clear();
  }
}
