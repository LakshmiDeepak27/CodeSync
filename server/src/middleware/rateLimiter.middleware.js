import rateLimit from 'express-rate-limit';
import { ENV } from '../config/env.js';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in a few minutes.'
  }
});

export const executionRateLimiter = rateLimit({
  windowMs: ENV.EXECUTION_RATE_LIMIT_WINDOW_MS,
  max: ENV.EXECUTION_RATE_LIMIT_MAX,
  keyGenerator: (req) => {
    // Rate limit per authenticated user if available, otherwise per IP
    return req.user?.userId || req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Code execution rate limit exceeded. Please wait a moment before running code again.'
  }
});
