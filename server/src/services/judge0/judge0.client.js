import axios from 'axios';
import { ENV } from '../../config/env.js';

const headers = {
  'Content-Type': 'application/json'
};

if (ENV.JUDGE0_API_KEY) {
  headers['X-RapidAPI-Key'] = ENV.JUDGE0_API_KEY;
  headers['X-Auth-Token'] = ENV.JUDGE0_API_KEY;
}

export const judge0Client = axios.create({
  baseURL: ENV.JUDGE0_BASE_URL,
  headers,
  timeout: ENV.JUDGE0_REQUEST_TIMEOUT
});
