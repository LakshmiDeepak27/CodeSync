import { ENV } from '../config/env.js';

export const errorHandler = (err, req, res, _next) => {
  console.error('[Error Middleware]:', err);

  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'An unexpected internal server error occurred.';

  // Handle Prisma unique constraint error
  if (err.code === 'P2002') {
    statusCode = 409;
    const target = err.meta?.target || '';
    const targetStr = Array.isArray(target) ? target.join(', ') : String(target);
    if (targetStr.includes('email')) {
      message = 'An account with this email address already exists. Please log in.';
    } else if (targetStr.includes('username')) {
      message = 'This username is already taken. Please choose another.';
    } else {
      message = 'An account with these details already exists.';
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(ENV.NODE_ENV === 'development' && { stack: err.stack })
  });
};
