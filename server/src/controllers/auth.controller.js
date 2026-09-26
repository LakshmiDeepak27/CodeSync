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

const resolveAppUrls = (req) => {
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:5000';
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const requestOrigin = `${proto}://${host}`;

  let clientUrl = ENV.CLIENT_URL;
  // If running in cloud (e.g. Render) but clientUrl was left at localhost or placeholder codesync.onrender.com, use current origin
  if (!clientUrl || (clientUrl.includes('localhost') && host.includes('onrender.com')) || clientUrl === 'https://codesync.onrender.com') {
    clientUrl = requestOrigin;
  }

  let callbackUrl = ENV.GOOGLE_CALLBACK_URL;
  if (!callbackUrl || (callbackUrl.includes('localhost') && host.includes('onrender.com')) || callbackUrl.startsWith('https://codesync.onrender.com')) {
    callbackUrl = `${clientUrl.replace(/\/+$/, '')}/api/auth/google/callback`;
  }

  return {
    clientUrl: clientUrl.replace(/\/+$/, ''),
    callbackUrl
  };
};

export class AuthController {
  static async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      if (result.token) {
        res.cookie('token', result.token, getCookieOptions(req));
      }
      res.status(201).json({
        success: true,
        message: result.message || 'Registered successfully.',
        token: result.token,
        user: result.user,
        devCode: result.devCode
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
        token,
        user
      });
    } catch (error) {
      if (error.requiresVerification) {
        return res.status(403).json({
          success: false,
          requiresVerification: true,
          email: error.email,
          message: error.message
        });
      }
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
        return res.status(200).json({ success: true, user: null });
      }
      const user = await AuthService.getCurrentUser(req.user.userId);
      if (!user) {
        return res.status(200).json({ success: true, user: null });
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
        token,
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
      if (result.token) {
        res.cookie('token', result.token, getCookieOptions(req));
      }
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async resendVerification(req, res, next) {
    try {
      const { email } = req.body;
      const result = await AuthService.resendVerificationCode(email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async googleAuth(req, res) {
    const { clientUrl, callbackUrl } = resolveAppUrls(req);

    if (!ENV.GOOGLE_CLIENT_ID || !ENV.GOOGLE_CLIENT_SECRET) {
      return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('Google OAuth is not configured on the server. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables.')}`);
    }

    // Generate Google OAuth URL with user's client ID
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const redirect = (req.query.redirect && req.query.redirect.startsWith('/')) ? req.query.redirect : '';
    const options = {
      redirect_uri: callbackUrl,
      client_id: ENV.GOOGLE_CLIENT_ID,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      ...(redirect ? { state: redirect } : {}),
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ].join(' ')
    };

    const qs = new URLSearchParams(options).toString();
    res.redirect(`${rootUrl}?${qs}`);
  }

  static async googleCallback(req, res) {
    const { clientUrl, callbackUrl } = resolveAppUrls(req);

    try {
      const { code, state, error: oauthError, error_description } = req.query;

      if (oauthError) {
        return res.redirect(`${clientUrl}/login?error=${encodeURIComponent(error_description || oauthError)}`);
      }

      if (!code) {
        return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('Google authentication was cancelled or code was missing')}`);
      }

      // Exchange code with Google OAuth token endpoint
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code.toString(),
          client_id: ENV.GOOGLE_CLIENT_ID,
          client_secret: ENV.GOOGLE_CLIENT_SECRET,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code'
        })
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok || !tokenData.access_token) {
        console.error('Google OAuth token exchange error:', tokenData);
        return res.redirect(`${clientUrl}/login?error=${encodeURIComponent(tokenData.error_description || tokenData.error || 'Failed to authenticate with Google')}`);
      }

      // Fetch user profile from Google userinfo API
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.error('Google userinfo fetch failed:', errorText);
        return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('Failed to fetch user profile from Google')}`);
      }

      const profile = await profileResponse.json();

      if (!profile || !profile.email) {
        return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('Could not retrieve email address from Google profile')}`);
      }

      const { token } = await AuthService.handleGoogleUser({
        googleId: profile.id,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture
      });

      res.cookie('token', token, getCookieOptions(req));

      const targetPath = (state && typeof state === 'string' && state.startsWith('/') && !state.startsWith('//'))
        ? state
        : '/dashboard';

      // Redirect to destination with token param for cross-origin or local storage support
      res.redirect(`${clientUrl}${targetPath}?token=${encodeURIComponent(token)}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${clientUrl}/login?error=${encodeURIComponent(error.message || 'Authentication failed')}`);
    }
  }
}
