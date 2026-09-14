import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  SERVER_URL: process.env.SERVER_URL || 'http://localhost:5000',
  DATABASE_URL: process.env.DATABASE_URL || 'mysql://root:codesyncpassword@localhost:3308/codesync',
  JWT_SECRET: process.env.JWT_SECRET || 'codesync-super-secret-jwt-key-for-development-change-in-prod-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
  JUDGE0_BASE_URL: process.env.JUDGE0_BASE_URL || 'http://127.0.0.1:2358',
  JUDGE0_API_KEY: process.env.JUDGE0_API_KEY || '',
  JUDGE0_POLL_INTERVAL: parseInt(process.env.JUDGE0_POLL_INTERVAL || '500', 10),
  JUDGE0_REQUEST_TIMEOUT: parseInt(process.env.JUDGE0_REQUEST_TIMEOUT || '15000', 10),
  EXECUTION_RATE_LIMIT_MAX: parseInt(process.env.EXECUTION_RATE_LIMIT_MAX || '30', 10),
  EXECUTION_RATE_LIMIT_WINDOW_MS: parseInt(process.env.EXECUTION_RATE_LIMIT_WINDOW_MS || '60000', 10)
};
