import { ENV } from '../config/env.js';

export const errorHandler = (err, req, res, _next) => {
  console.error('[Error Middleware]:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(ENV.NODE_ENV === 'development' && { stack: err.stack })
  });
};
