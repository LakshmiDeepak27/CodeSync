import { judge0Client } from './judge0.client.js';
import { normalizeJudge0Response } from './judge0.mapper.js';
import { JUDGE0_STATUS_IDS } from './judge0.types.js';
import { EXECUTION_STATUS } from '@codesync/shared/constants';
import { ENV } from '../../config/env.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class Judge0Service {
  /**
   * Submit code to Judge0 with base64 encoding to prevent UTF-8 serialization issues
   * @param {Object} params
   * @param {string} params.sourceCode
   * @param {number} params.languageId
   * @param {string} [params.stdin]
   * @returns {Promise<Object>} Normalized execution result
   */
  static async executeCode({ sourceCode, languageId, stdin = '' }) {
    try {
      // Step 1: Encode source code and stdin in Base64 for guaranteed binary-safe transmission
      const b64Source = Buffer.from(sourceCode || '', 'utf-8').toString('base64');
      const b64Stdin = Buffer.from(stdin || '', 'utf-8').toString('base64');

      const postResponse = await judge0Client.post('/submissions?base64_encoded=true&wait=true', {
        source_code: b64Source,
        language_id: languageId,
        stdin: b64Stdin
      });

      const submission = postResponse.data;

      // If already finished, normalize immediately
      if (
        submission.status &&
        submission.status.id !== JUDGE0_STATUS_IDS.IN_QUEUE &&
        submission.status.id !== JUDGE0_STATUS_IDS.PROCESSING
      ) {
        return normalizeJudge0Response(submission, true);
      }

      // Step 2: Poll token if still in queue
      const token = submission.token;
      if (!token) {
        return normalizeJudge0Response(submission, true);
      }

      const startTime = Date.now();
      while (Date.now() - startTime < ENV.JUDGE0_REQUEST_TIMEOUT) {
        await sleep(ENV.JUDGE0_POLL_INTERVAL);

        const pollResponse = await judge0Client.get(`/submissions/${token}?base64_encoded=true`);
        const polled = pollResponse.data;

        if (
          polled.status &&
          polled.status.id !== JUDGE0_STATUS_IDS.IN_QUEUE &&
          polled.status.id !== JUDGE0_STATUS_IDS.PROCESSING
        ) {
          return normalizeJudge0Response(polled, true);
        }
      }

      // Timeout waiting for Judge0
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
      console.error('[Judge0Service Error]:', error?.response?.data || error?.message || error);
      const detailMsg = error?.response?.data?.error || error?.message || 'Code execution engine error';
      return {
        status: EXECUTION_STATUS.JUDGE_ERROR,
        stdout: '',
        stderr: detailMsg,
        compileError: '',
        runtimeError: detailMsg,
        exitCode: 1,
        executionTime: 0,
        memoryUsed: 0,
        rawStatusDescription: 'Judge0 Error'
      };
    }
  }
}
