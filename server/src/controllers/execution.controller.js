import { Judge0Service } from '../services/judge0/judge0.service.js';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '@codesync/shared/constants';

export class ExecutionController {
  static async execute(req, res, next) {
    try {
      const { language = DEFAULT_LANGUAGE, code, stdin = '' } = req.body;

      // Find Judge0 language ID from supported languages map
      const langConfig = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.cpp;
      const judge0Id = langConfig.judge0Id;

      const result = await Judge0Service.executeCode({
        sourceCode: code,
        languageId: judge0Id,
        stdin
      });

      res.status(200).json({
        success: true,
        result
      });
    } catch (error) {
      next(error);
    }
  }
}
