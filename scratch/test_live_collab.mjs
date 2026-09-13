import { io } from 'socket.io-client';
import * as Y from 'yjs';
import { SocketIOProvider } from 'y-socket.io';

const SERVER_URL = 'https://codesync-v81l.onrender.com';
const ROOM_ID = 'c1f7c0d3-692d-4700-bf72-dce77914c935';

// Let's create two Y.Docs representing two users
const doc1 = new Y.Doc();
const doc2 = new Y.Doc();

console.log('[Test] Connecting User 1...');
const provider1 = new SocketIOProvider(SERVER_URL, ROOM_ID, doc1, { autoConnect: true }, { transports: ['websocket', 'polling'] });

console.log('[Test] Connecting User 2...');
const provider2 = new SocketIOProvider(SERVER_URL, ROOM_ID, doc2, { autoConnect: true }, { transports: ['websocket', 'polling'] });

provider1.on('status', (s) => console.log('[Provider 1 status]', s));
provider2.on('status', (s) => console.log('[Provider 2 status]', s));

provider1.on('sync', (synced) => {
  console.log('[Provider 1 sync]', synced);
  if (synced) {
    const yFiles1 = doc1.getMap('files');
    console.log('[Doc 1 files keys]', Array.from(yFiles1.keys()));
    const yText1 = yFiles1.get('main.cpp');
    if (yText1) {
      console.log('[Doc 1 main.cpp content]:\n' + yText1.toString());
    } else {
      console.log('[Doc 1 main.cpp is missing!]');
    }
  }
});

provider2.on('sync', (synced) => {
  console.log('[Provider 2 sync]', synced);
  if (synced) {
    const yFiles2 = doc2.getMap('files');
    console.log('[Doc 2 files keys]', Array.from(yFiles2.keys()));
    const yText2 = yFiles2.get('main.cpp');
    if (yText2) {
      console.log('[Doc 2 main.cpp content]:\n' + yText2.toString());
    } else {
      console.log('[Doc 2 main.cpp is missing!]');
    }
  }
});

// Set awareness
provider1.awareness.setLocalStateField('user', { username: 'testUser1', color: '#ff0000' });
provider2.awareness.setLocalStateField('user', { username: 'testUser2', color: '#00ff00' });

provider1.awareness.on('change', () => {
  const states = Array.from(provider1.awareness.getStates().values());
  console.log('[Provider 1 sees awareness users]:', states.map(s => s.user?.username));
});

provider2.awareness.on('change', () => {
  const states = Array.from(provider2.awareness.getStates().values());
  console.log('[Provider 2 sees awareness users]:', states.map(s => s.user?.username));
});

setTimeout(() => {
  console.log('--- 5 seconds passed. Now User 1 edits main.cpp ---');
  const yFiles1 = doc1.getMap('files');
  let yText1 = yFiles1.get('main.cpp');
  if (!yText1) {
    yText1 = new Y.Text();
    yFiles1.set('main.cpp', yText1);
  }
  yText1.insert(0, '// Edit from User 1 at ' + Date.now() + '\n');
}, 5000);

setTimeout(() => {
  console.log('--- 8 seconds passed. Checking User 2 doc ---');
  const yFiles2 = doc2.getMap('files');
  const yText2 = yFiles2.get('main.cpp');
  console.log('[User 2 sees main.cpp]:', yText2 ? yText2.toString() : 'NULL');
  process.exit(0);
}, 10000);
