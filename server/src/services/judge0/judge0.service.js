import { judge0Client } from './judge0.client.js';
import { normalizeJudge0Response } from './judge0.mapper.js';
import { JUDGE0_STATUS_IDS } from './judge0.types.js';
import { EXECUTION_STATUS } from '@codesync/shared/constants';
import { ENV } from '../../config/env.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class Judge0Service {
  /**
   * Submit code to Judge0 and wait or poll for completion
   * @param {Object} params
   * @param {string} params.sourceCode
   * @param {number} params.languageId
   * @param {string} [params.stdin]
   * @returns {Promise<Object>} Normalized execution result
   */
  static async executeCode({ sourceCode, languageId, stdin = '' }) {
    try {
      // Step 1: Create submission with wait=true for fast response
      const postResponse = await judge0Client.post('/submissions?base64_encoded=false&wait=true', {
        source_code: sourceCode,
        language_id: languageId,
        stdin: stdin || ''
      });

      const submission = postResponse.data;

      // If already finished (status not in queue / processing), normalize immediately
      if (
        submission.status &&
        submission.status.id !== JUDGE0_STATUS_IDS.IN_QUEUE &&
        submission.status.id !== JUDGE0_STATUS_IDS.PROCESSING
      ) {
        return normalizeJudge0Response(submission);
      }

      // Step 2: If still queued/processing, poll token until finished or timeout
      const token = submission.token;
      if (!token) {
        return normalizeJudge0Response(submission);
      }

      const startTime = Date.now();
      while (Date.now() - startTime < ENV.JUDGE0_REQUEST_TIMEOUT) {
        await sleep(ENV.JUDGE0_POLL_INTERVAL);

        const pollResponse = await judge0Client.get(`/submissions/${token}?base64_encoded=false`);
        const polled = pollResponse.data;

        if (
          polled.status &&
          polled.status.id !== JUDGE0_STATUS_IDS.IN_QUEUE &&
          polled.status.id !== JUDGE0_STATUS_IDS.PROCESSING
        ) {
          return normalizeJudge0Response(polled);
        }
      }

      // If we reach here, timeout waiting for Judge0
      return {
        status: EXECUTION_STATUS.TIME_LIMIT,
        stdout: '',
        stderr: 'Execution timed out waiting for result.',
        compileError: '',
        runtimeError: 'Time Limit Exceeded',
        exitCode: 124,
        executionTime: ENV.JUDGE0_REQUEST_TIMEOUT / 1000,
        memoryUsed: 0,
        rawStatusDescription: 'Time Limit Exceeded'
      };
    } catch (error) {
      console.error('[Judge0Service Error]:', error?.message || error);
      return {
        status: EXECUTION_STATUS.JUDGE_ERROR,
        stdout: '',
        stderr: '',
        compileError: '',
        runtimeError: 'Code execution is temporarily unavailable. Please try again.',
        exitCode: 1,
        executionTime: 0,
        memoryUsed: 0,
        rawStatusDescription: 'Judge0 Unavailable'
      };
    }
  }
}
