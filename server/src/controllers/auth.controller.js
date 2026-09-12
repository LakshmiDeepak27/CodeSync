import { AuthService } from '../services/auth.service.js';
import { ENV } from '../config/env.js';

const getCookieOptions = (req) => {
  const isHttps = req?.secure || req?.headers?.['x-forwarded-proto'] === 'https' || process.env.COOKIE_SECURE === 'true';
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
};

export class AuthController {
  static async register(req, res, next) {
    try {
      const { user, token } = await AuthService.register(req.body);
      res.cookie('token', token, getCookieOptions(req));
      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        user
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { user, token } = await AuthService.login(req.body);
      res.cookie('token', token, getCookieOptions(req));
      res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        user
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res) {
    res.clearCookie('token', getCookieOptions(req));
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  }

  static async me(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }
      const user = await AuthService.getCurrentUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.status(200).json({
        success: true,
        user
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }
      const { user, token } = await AuthService.updateProfile(req.user.userId, req.body);
      res.cookie('token', token, getCookieOptions(req));
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        user
      });
    } catch (error) {
      next(error);
    }
  }

  static async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }
      const result = await AuthService.requestPasswordReset(email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { email, code, newPassword } = req.body;
      const result = await AuthService.resetPassword(email, code, newPassword);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async verifyEmail(req, res, next) {
    try {
      const { email, code } = req.body;
      const result = await AuthService.verifyEmail(email, code);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async googleAuth(req, res) {
    const clientOrigin = req.headers.referer ? new URL(req.headers.referer).origin : (req.headers.origin || ENV.CLIENT_URL);
    if (!ENV.GOOGLE_CLIENT_ID || ENV.GOOGLE_CLIENT_ID.startsWith('mock') || !ENV.GOOGLE_CLIENT_SECRET || ENV.GOOGLE_CLIENT_SECRET === 'mock-google-client-secret') {
      const mockGoogleUser = {
        googleId: `google_dev_${Date.now()}`,
        email: 'developer@codesync.dev',
        name: 'CodeSync Developer',
        avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=dev'
      };
      const { user, token } = await AuthService.handleGoogleUser(mockGoogleUser);
      res.cookie('token', token, getCookieOptions(req));
      return res.redirect(`${clientOrigin}/dashboard`);
    }

    // Generate Google OAuth URL
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: ENV.GOOGLE_CALLBACK_URL,
      client_id: ENV.GOOGLE_CLIENT_ID,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ].join(' ')
    };

    const qs = new URLSearchParams(options).toString();
    res.redirect(`${rootUrl}?${qs}`);
  }

  static async googleCallback(req, res) {
    const clientOrigin = req.headers.referer ? new URL(req.headers.referer).origin : (req.headers.origin || ENV.CLIENT_URL);
    try {
      const { code } = req.query;
      if (!code) {
        return res.redirect(`${clientOrigin}/login?error=Google+auth+cancelled`);
      }

      if (!ENV.GOOGLE_CLIENT_SECRET || ENV.GOOGLE_CLIENT_SECRET === 'mock-google-client-secret') {
        const mockGoogleUser = {
          googleId: `google_dev_${Date.now()}`,
          email: 'developer@codesync.dev',
          name: 'CodeSync Developer',
          avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=dev'
        };
        const { user, token } = await AuthService.handleGoogleUser(mockGoogleUser);
        res.cookie('token', token, getCookieOptions(req));
        return res.redirect(`${clientOrigin}/dashboard`);
      }

      // Exchange code with Google
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code.toString(),
          client_id: ENV.GOOGLE_CLIENT_ID,
          client_secret: ENV.GOOGLE_CLIENT_SECRET,
          redirect_uri: ENV.GOOGLE_CALLBACK_URL,
          grant_type: 'authorization_code'
        })
      });

      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) {
        return res.redirect(`${ENV.CLIENT_URL}/login?error=Failed+to+authenticate+with+Google`);
      }

      // Fetch user profile from Google
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const profile = await profileResponse.json();

      const { token } = await AuthService.handleGoogleUser({
        googleId: profile.id,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture
      });

      res.cookie('token', token, getCookieOptions(req));
      res.redirect(`${ENV.CLIENT_URL}/dashboard`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${ENV.CLIENT_URL}/login?error=Authentication+failed`);
    }
  }
}
