import * as Y from 'yjs';

const doc1 = new Y.Doc();
const doc2 = new Y.Doc();

// Simulate sync from doc1 to doc2
doc1.on('update', update => Y.applyUpdate(doc2, update));
doc2.on('update', update => Y.applyUpdate(doc1, update));

const files1 = doc1.getMap('files');
const text1 = new Y.Text('Hello World');
files1.set('main.cpp', text1);

const files2 = doc2.getMap('files');
const text2 = files2.get('main.cpp');

console.log('Doc2 text2 content:', text2.toString());

// Now create relative position on doc2
const relPos = Y.createRelativePositionFromTypeIndex(text2, 5);
// Resolve on doc1
const absPos = Y.createAbsolutePositionFromRelativePosition(relPos, doc1);

console.log('absPos index:', absPos.index);
console.log('absPos.type === text1:', absPos.type === text1);

// NOW test conflicting creation:
const badDoc1 = new Y.Doc();
const badDoc2 = new Y.Doc();
const badFiles1 = badDoc1.getMap('files');
const badFiles2 = badDoc2.getMap('files');

// Both independently create main.cpp before sync!
const badText1 = new Y.Text('Hello from 1');
badFiles1.set('main.cpp', badText1);

const badText2 = new Y.Text('Hello from 2');
badFiles2.set('main.cpp', badText2);

// Now sync
Y.applyUpdate(badDoc2, Y.encodeStateAsUpdate(badDoc1));
Y.applyUpdate(badDoc1, Y.encodeStateAsUpdate(badDoc2));

console.log('\n--- AFTER CONFLICTING CREATION ---');
console.log('badDoc1 files get main.cpp:', badFiles1.get('main.cpp').toString());
console.log('badDoc2 files get main.cpp:', badFiles2.get('main.cpp').toString());
console.log('Is badText1 === badFiles1.get("main.cpp")?', badText1 === badFiles1.get('main.cpp'));
console.log('Is badText2 === badFiles2.get("main.cpp")?', badText2 === badFiles2.get('main.cpp'));

// Now test relative position from badText2 resolved on badDoc1
const badRel = Y.createRelativePositionFromTypeIndex(badText2, 3);
const badAbs = Y.createAbsolutePositionFromRelativePosition(badRel, badDoc1);
console.log('badAbs type === badText1?', badAbs?.type === badText1);
console.log('badAbs type === badFiles1.get("main.cpp")?', badAbs?.type === badFiles1.get('main.cpp'));
