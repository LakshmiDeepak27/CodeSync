import { AuthService } from '../src/services/auth.service.js';
import { RoomService } from '../src/services/room.service.js';
import { FileService } from '../src/services/file.service.js';
import { ChatService } from '../src/services/chat.service.js';
import { Judge0Service } from '../src/services/judge0/judge0.service.js';
import { prisma } from '../src/services/prisma.js';
import { ROLES, SUPPORTED_LANGUAGES, EXECUTION_STATUS } from '@codesync/shared/constants';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n=============================================');
  console.log('--- RUNNING CODESYNC INTEGRATION TEST SUITE ---');
  console.log('=============================================\n');

  try {
    // 1. Auth Test: Registration
    console.log('[1/6] Testing Authentication (Register & Login)...');
    const testUsername = `user_${Date.now()}`;
    const testEmail = `${testUsername}@example.com`;
    const testPassword = 'Password123!';

    const regResult = await AuthService.register({
      name: 'Integration Tester',
      username: testUsername,
      email: testEmail,
      password: testPassword
    });

    assert(regResult.user.id && regResult.token, 'User registered and received valid JWT');
    assert(regResult.user.email === testEmail, 'User email matches registered email');

    const loginResult = await AuthService.login({
      email: testEmail,
      password: testPassword
    });
    assert(loginResult.user.id === regResult.user.id, 'User login succeeds and returns matching profile');
    assert(loginResult.token, 'Login issues authenticated JWT token');

    // 2. Room Service Test
    console.log('\n[2/6] Testing Room Creation & Starter File...');
    const room = await RoomService.createRoom({
      name: 'Test Algorithms Room',
      description: 'Room for integration testing',
      language: 'cpp',
      visibility: 'PUBLIC',
      userId: regResult.user.id
    });

    assert(room.id && room.roomCode, 'Room created with unique RoomCode: #' + room.roomCode);

    const roomDetail = await RoomService.getRoomByCodeOrId(room.id);
    assert(roomDetail.members.length === 1, 'Room owner added to room members');
    assert(roomDetail.files.length >= 1, 'Default starter file main.cpp created automatically');
    assert(roomDetail.files[0].language === 'cpp', 'Starter file has correct C++ language');

    // 3. Room Membership / Join Test
    console.log('\n[3/6] Testing Secondary User Joining Room...');
    const user2Name = `user2_${Date.now()}`;
    const user2 = await AuthService.register({
      name: 'Second Developer',
      username: user2Name,
      email: `${user2Name}@example.com`,
      password: testPassword
    });

    const joinedRoom = await RoomService.joinRoom({
      roomCodeOrId: room.roomCode,
      userId: user2.user.id
    });

    assert(joinedRoom.members.some(m => m.userId === user2.user.id), 'Second user successfully joined room');
    const user2Role = await RoomService.checkUserRoomRole(room.id, user2.user.id);
    assert(user2Role === ROLES.EDITOR, 'Second user has EDITOR permissions');

    // 4. File Operations Test
    console.log('\n[4/6] Testing Multi-file Operations (Create, Update, Rename, Delete)...');
    const newFile = await FileService.createFile({
      roomId: room.id,
      name: 'solution.h',
      path: '/solution.h',
      content: '#pragma once\nint add(int a, int b) { return a + b; }\n'
    });
    assert(newFile.name === 'solution.h', 'New file solution.h created');

    const updatedFile = await FileService.updateContent(newFile.id, '#pragma once\n// updated content\n');
    assert(updatedFile.version > newFile.version, 'File version incremented on content update');

    const renamedFile = await FileService.renameFile(newFile.id, 'helpers.h');
    assert(renamedFile.name === 'helpers.h', 'File renamed to helpers.h');

    await FileService.deleteFile(renamedFile.id, room.id);
    const filesAfterDelete = await prisma.file.findMany({ where: { roomId: room.id } });
    assert(!filesAfterDelete.some(f => f.id === renamedFile.id), 'File deleted successfully');

    // 5. Chat Operations Test
    console.log('\n[5/6] Testing Real-Time Chat Persistence...');
    const chatMsg = await ChatService.saveMessage({
      roomId: room.id,
      userId: regResult.user.id,
      content: 'Hello team, let us solve the problem!'
    });
    assert(chatMsg.id && chatMsg.content === 'Hello team, let us solve the problem!', 'Chat message persisted in database');

    const history = await ChatService.getRoomMessages(room.id);
    assert(history.length >= 1, 'Chat message retrieved from room history');

    // 6. Judge0 C++ Execution Tests
    console.log('\n[6/6] Testing Judge0 C++ Execution Integration...');

    // Test 6a: Successful C++ execution
    const cppCode = `#include <iostream>
using namespace std;
int main() {
    cout << "Hello CodeSync Production";
    return 0;
}`;

    console.log('  -> Executing Hello World C++ program via Judge0...');
    const resultSuccess = await Judge0Service.executeCode({
      sourceCode: cppCode,
      languageId: SUPPORTED_LANGUAGES.cpp.judge0Id
    });

    assert(resultSuccess.status === EXECUTION_STATUS.COMPLETED, `Judge0 execution completed (status: ${resultSuccess.status})`);
    assert(resultSuccess.stdout.trim() === 'Hello CodeSync Production', `Stdout matches expected output: "${resultSuccess.stdout.trim()}"`);
    assert(resultSuccess.exitCode === 0, 'Exit code is 0');

    // Test 6b: Stdin support
    console.log('  -> Testing C++ with Stdin...');
    const stdinCode = `#include <iostream>
using namespace std;
int main() {
    int a, b;
    cin >> a >> b;
    cout << "SUM=" << (a + b);
    return 0;
}`;

    const resultStdin = await Judge0Service.executeCode({
      sourceCode: stdinCode,
      languageId: SUPPORTED_LANGUAGES.cpp.judge0Id,
      stdin: '25 75'
    });

    assert(resultStdin.status === EXECUTION_STATUS.COMPLETED, 'Judge0 executed program with stdin');
    assert(resultStdin.stdout.trim() === 'SUM=100', `Program correctly read stdin 25 75 and printed SUM=100 (got: "${resultStdin.stdout.trim()}")`);

    // Test 6c: Compilation error handling
    console.log('  -> Testing C++ Compilation Error handling...');
    const invalidCpp = `int main() { syntax error here }`;
    const resultCompileErr = await Judge0Service.executeCode({
      sourceCode: invalidCpp,
      languageId: SUPPORTED_LANGUAGES.cpp.judge0Id
    });

    assert(resultCompileErr.status === EXECUTION_STATUS.COMPILATION_ERROR, 'Compilation error status detected');
    assert(resultCompileErr.compileError.length > 0, 'Compilation diagnostic captured');

    // Clean up test room
    await RoomService.deleteRoom(room.id, regResult.user.id);
    console.log('\n  ✓ Test room cleaned up successfully.');

  } catch (err) {
    console.error('Unexpected test failure:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n=============================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
