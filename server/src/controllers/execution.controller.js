import { Judge0Service } from '../services/judge0/judge0.service.js';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '@codesync/shared/constants';

export class ExecutionController {
  static async execute(req, res, next) {
    try {
      const {
        sourceCode,
        code = sourceCode,
        language = 'cpp',
        languageId,
        stdin = ''
      } = req.body;

      // Find Judge0 language ID with robust alias mapping
      let judge0Id = languageId;
      if (!judge0Id) {
        const normalizedLang = (language || 'cpp').toLowerCase().trim();
        const langKeyMap = {
          py: 'python',
          python: 'python',
          cpp: 'cpp',
          'c++': 'cpp',
          c: 'c',
          js: 'javascript',
          javascript: 'javascript',
          ts: 'javascript',
          typescript: 'javascript'
        };
        const mappedKey = langKeyMap[normalizedLang] || normalizedLang;
        const langConfig = SUPPORTED_LANGUAGES[mappedKey] || SUPPORTED_LANGUAGES.cpp;
        judge0Id = langConfig.judge0Id;
      }

      const result = await Judge0Service.executeCode({
        sourceCode: code,
        languageId: judge0Id,
        stdin
      });

      const stdout = result.stdout || '';
      const stderr = result.stderr || result.compileError || result.runtimeError || '';

      res.status(200).json({
        success: true,
        stdout,
        stderr,
        exitCode: result.exitCode,
        time: result.executionTime ? String(result.executionTime) : null,
        memory: result.memoryUsed || null,
        status: result.status,
        result
      });
    } catch (error) {
      next(error);
    }
  }
}
