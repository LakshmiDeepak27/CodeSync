import { EXECUTION_STATUS } from '@codesync/shared/constants';
import { JUDGE0_STATUS_MAP } from './judge0.types.js';

function decodeBase64Safe(val) {
  if (!val || typeof val !== 'string') return '';
  try {
    return Buffer.from(val, 'base64').toString('utf-8');
  } catch {
    return val;
  }
}

export function normalizeJudge0Response(raw, isBase64 = true) {
  if (!raw) {
    return {
      status: EXECUTION_STATUS.JUDGE_ERROR,
      stdout: '',
      stderr: '',
      compileError: '',
      runtimeError: 'Empty response from execution engine',
      exitCode: 1,
      executionTime: 0,
      memoryUsed: 0,
      rawStatusDescription: 'Unknown Error'
    };
  }

  const rawStdout = isBase64 ? decodeBase64Safe(raw.stdout) : (raw.stdout || '');
  const rawStderr = isBase64 ? decodeBase64Safe(raw.stderr) : (raw.stderr || '');
  const rawCompile = isBase64 ? decodeBase64Safe(raw.compile_output) : (raw.compile_output || '');
  const rawMsg = isBase64 ? decodeBase64Safe(raw.message) : (raw.message || '');

  const statusId = raw.status?.id;
  const normalizedStatus = JUDGE0_STATUS_MAP[statusId] || EXECUTION_STATUS.EXECUTION_ERROR;

  return {
    status: normalizedStatus,
    stdout: rawStdout,
    stderr: rawStderr || rawCompile,
    compileError: rawCompile,
    runtimeError: rawMsg || (normalizedStatus === EXECUTION_STATUS.RUNTIME_ERROR ? (rawStderr || 'Runtime failure') : ''),
    exitCode: raw.exit_code ?? (normalizedStatus === EXECUTION_STATUS.COMPLETED ? 0 : 1),
    executionTime: parseFloat(raw.time) || 0,
    memoryUsed: parseInt(raw.memory, 10) || 0,
    rawStatusDescription: raw.status?.description || 'Unknown'
  };
}
