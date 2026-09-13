import axios from 'axios';
import { ENV } from '../../config/env.js';

const headers = {
  'Content-Type': 'application/json'
};

if (ENV.JUDGE0_API_KEY) {
  headers['X-RapidAPI-Key'] = ENV.JUDGE0_API_KEY;
  headers['X-Auth-Token'] = ENV.JUDGE0_API_KEY;
}

try {
  const url = new URL(ENV.JUDGE0_BASE_URL);
  if (process.env.JUDGE0_HOST) {
    headers['X-RapidAPI-Host'] = process.env.JUDGE0_HOST;
  } else if (url.hostname.includes('rapidapi.com')) {
    headers['X-RapidAPI-Host'] = url.hostname;
  }
} catch {
  // Ignore URL parse error for relative or local endpoints
}

export const judge0Client = axios.create({
  baseURL: ENV.JUDGE0_BASE_URL,
  headers,
  timeout: ENV.JUDGE0_REQUEST_TIMEOUT
});
