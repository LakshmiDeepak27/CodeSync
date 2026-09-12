import { EXECUTION_STATUS } from '@codesync/shared/constants';
import { JUDGE0_STATUS_MAP } from './judge0.types.js';

export function normalizeJudge0Response(raw) {
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

  const statusId = raw.status?.id;
  const normalizedStatus = JUDGE0_STATUS_MAP[statusId] || EXECUTION_STATUS.EXECUTION_ERROR;

  return {
    status: normalizedStatus,
    stdout: raw.stdout || '',
    stderr: raw.stderr || '',
    compileError: raw.compile_output || '',
    runtimeError: raw.message || (normalizedStatus === EXECUTION_STATUS.RUNTIME_ERROR ? (raw.stderr || 'Runtime failure') : ''),
    exitCode: raw.exit_code ?? (normalizedStatus === EXECUTION_STATUS.COMPLETED ? 0 : 1),
    executionTime: parseFloat(raw.time) || 0,
    memoryUsed: parseInt(raw.memory, 10) || 0,
    rawStatusDescription: raw.status?.description || 'Unknown'
  };
}
