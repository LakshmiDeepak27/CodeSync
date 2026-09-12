export const SOCKET_EVENTS = {
  // Room
  ROOM_JOIN: 'room:join',
  ROOM_JOINED: 'room:joined',
  ROOM_LEAVE: 'room:leave',
  USER_JOINED: 'room:user_joined',
  USER_LEFT: 'room:user_left',

  // Presence
  PRESENCE_SYNC: 'presence:sync',
  PRESENCE_HEARTBEAT: 'presence:heartbeat',

  // Cursors & Selection
  CURSOR_UPDATE: 'cursor:update',
  CURSOR_BROADCAST: 'cursor:broadcast',

  // Editor Real-time Sync
  EDITOR_OPERATION: 'editor:operation',
  EDITOR_BROADCAST: 'editor:broadcast',
  EDITOR_SYNC_REQUEST: 'editor:sync_request',
  EDITOR_SYNC_RESPONSE: 'editor:sync_response',

  // Yjs doc sync
  YJS_SYNC_STEP_1: 'yjs:sync_step_1',
  YJS_SYNC_STEP_2: 'yjs:sync_step_2',
  YJS_UPDATE: 'yjs:update',

  // Files
  FILE_CREATED: 'file:created',
  FILE_UPDATED: 'file:updated',
  FILE_RENAMED: 'file:renamed',
  FILE_DELETED: 'file:deleted',
  FILE_ACTIVE: 'file:active',

  // Chat
  CHAT_SEND: 'chat:send',
  CHAT_MESSAGE: 'chat:message',

  // Execution
  EXECUTE_START: 'execute:start',
  EXECUTE_RESULT: 'execute:result',

  // Errors
  ERROR: 'error'
};
