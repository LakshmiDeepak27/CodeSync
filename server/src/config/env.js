import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from multiple candidate paths (workspace root, server root, cwd)
const candidatePaths = [
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env')
];

for (const p of candidatePaths) {
  dotenv.config({ path: p });
}
dotenv.config();

const cleanEnvStr = (val, defaultVal = '') => {
  const v = val !== undefined && val !== null ? String(val).trim() : defaultVal;
  return v.replace(/^["']|["']$/g, '').trim();
};

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: cleanEnvStr(process.env.NODE_ENV, 'development'),
  CLIENT_URL: cleanEnvStr(process.env.CLIENT_URL, 'http://localhost:5173'),
  SERVER_URL: cleanEnvStr(process.env.SERVER_URL, 'http://localhost:5000'),
  DATABASE_URL: cleanEnvStr(process.env.DATABASE_URL, 'mysql://root:codesyncpassword@localhost:3308/codesync'),
  JWT_SECRET: cleanEnvStr(process.env.JWT_SECRET, 'codesync-super-secret-jwt-key-for-development-change-in-prod-2026'),
  JWT_EXPIRES_IN: cleanEnvStr(process.env.JWT_EXPIRES_IN, '7d'),
  EMAIL_USER: cleanEnvStr(process.env.EMAIL_USER, ''),
  EMAIL_PASS: cleanEnvStr(process.env.EMAIL_PASS, ''),
  GOOGLE_CLIENT_ID: cleanEnvStr(process.env.GOOGLE_CLIENT_ID, ''),
  GOOGLE_CLIENT_SECRET: cleanEnvStr(process.env.GOOGLE_CLIENT_SECRET, ''),
  GOOGLE_CALLBACK_URL: cleanEnvStr(process.env.GOOGLE_CALLBACK_URL, 'http://localhost:5000/api/auth/google/callback'),
  JUDGE0_BASE_URL: cleanEnvStr(process.env.JUDGE0_BASE_URL, 'http://127.0.0.1:2358'),
  JUDGE0_API_KEY: cleanEnvStr(process.env.JUDGE0_API_KEY, ''),
  JUDGE0_POLL_INTERVAL: parseInt(process.env.JUDGE0_POLL_INTERVAL || '500', 10),
  JUDGE0_REQUEST_TIMEOUT: parseInt(process.env.JUDGE0_REQUEST_TIMEOUT || '15000', 10),
  EXECUTION_RATE_LIMIT_MAX: parseInt(process.env.EXECUTION_RATE_LIMIT_MAX || '30', 10),
  EXECUTION_RATE_LIMIT_WINDOW_MS: parseInt(process.env.EXECUTION_RATE_LIMIT_WINDOW_MS || '60000', 10)
};
