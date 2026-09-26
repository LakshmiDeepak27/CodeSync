import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export const requireAuth = (req, res, next) => {
  try {
    let headerToken = null;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      headerToken = req.headers.authorization.split(' ')[1];
    }
    const cookieToken = req.cookies?.token;

    // Prefer header token (usually newer from client storage), fallback to cookie
    const primaryToken = headerToken || cookieToken;
    const secondaryToken = headerToken ? cookieToken : null;

    if (!primaryToken) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    try {
      req.user = jwt.verify(primaryToken, ENV.JWT_SECRET);
      return next();
    } catch (err) {
      // If primary failed but a secondary token exists, try secondary
      if (secondaryToken && secondaryToken !== primaryToken) {
        req.user = jwt.verify(secondaryToken, ENV.JWT_SECRET);
        return next();
      }
      throw err;
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.'
    });
  }
};

export const optionalAuth = (req, _res, next) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      req.user = decoded;
    }
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
};
