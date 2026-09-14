import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma.js';
import { ENV } from '../config/env.js';
import { EmailService } from './email.service.js';

export class AuthService {
  static async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  static async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  static generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username
      },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN }
    );
  }

  static generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async register({ name, username, email, password }) {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    const verificationCode = this.generateVerificationCode();
    const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    const passwordHash = await this.hashPassword(password);

    if (existingEmail) {
      if (existingEmail.isVerified) {
        const error = new Error('An account with this email already exists. Please log in.');
        error.status = 409;
        throw error;
      }

      // If user exists but is not yet verified, update credentials and send fresh verification code
      const updatedUser = await prisma.user.update({
        where: { id: existingEmail.id },
        data: {
          name: name || existingEmail.name,
          passwordHash,
          verificationCode,
          verificationCodeExpiresAt
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true
        }
      });

      try {
        await EmailService.sendVerificationEmail(email, verificationCode, updatedUser.name);
      } catch (err) {
        console.error('[AuthService] Failed to send verification email:', err);
      }

      return {
        requiresVerification: true,
        email: updatedUser.email,
        message: 'Account updated. A new 6-digit verification code has been sent to your email.'
      };
    }

    let finalUsername = username?.trim();
    if (!finalUsername) {
      let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || 'user';
      finalUsername = baseUsername;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
        finalUsername = `${baseUsername}${counter}`;
        counter++;
      }
    } else {
      const existingUsername = await prisma.user.findUnique({ where: { username: finalUsername } });
      if (existingUsername) {
        const error = new Error('This username is already taken. Please choose another.');
        error.status = 409;
        throw error;
      }
    }

    const user = await prisma.user.create({
      data: {
        name: name || finalUsername,
        username: finalUsername,
        email,
        passwordHash,
        isVerified: false,
        verificationCode,
        verificationCodeExpiresAt,
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(finalUsername)}`
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        isVerified: true
      }
    });

    try {
      await EmailService.sendVerificationEmail(email, verificationCode, user.name || finalUsername);
    } catch (err) {
      console.error('[AuthService] Failed to send verification email:', err);
    }

    return {
      requiresVerification: true,
      email: user.email,
      message: 'Registration successful! A 6-digit verification code has been sent to your email.'
    };
  }

  static async login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      const error = new Error('Invalid email or password.');
      error.status = 401;
      throw error;
    }

    const isMatch = await this.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.status = 401;
      throw error;
    }

    // Check if email is verified
    if (!user.isVerified) {
      const verificationCode = this.generateVerificationCode();
      const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationCode,
          verificationCodeExpiresAt
        }
      });

      try {
        await EmailService.sendVerificationEmail(user.email, verificationCode, user.name);
      } catch (err) {
        console.error('[AuthService] Failed to send verification email on login:', err);
      }

      const error = new Error('Please verify your email address before logging in. A new 6-digit verification code has been sent to your email.');
      error.status = 403;
      error.requiresVerification = true;
      error.email = user.email;
      throw error;
    }

    const token = this.generateToken(user);
    return {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      },
      token
    };
  }

  static async verifyEmail(email, code) {
    if (!email || !code) {
      const error = new Error('Email and verification code are required.');
      error.status = 400;
      throw error;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const error = new Error('No account found with this email address.');
      error.status = 404;
      throw error;
    }

    if (user.isVerified) {
      const token = this.generateToken(user);
      return {
        success: true,
        message: 'Account is already verified.',
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          isVerified: true,
          createdAt: user.createdAt
        },
        token
      };
    }

    if (!user.verificationCode || user.verificationCode.trim() !== code.trim()) {
      const error = new Error('Invalid verification code. Please check your code or request a new one.');
      error.status = 400;
      throw error;
    }

    if (user.verificationCodeExpiresAt && new Date() > new Date(user.verificationCodeExpiresAt)) {
      const error = new Error('Verification code has expired. Please click Resend Code to receive a new one.');
      error.status = 400;
      throw error;
    }

    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null
      }
    });

    const token = this.generateToken(verifiedUser);
    return {
      success: true,
      message: 'Your email has been verified successfully! You are now logged in.',
      user: {
        id: verifiedUser.id,
        name: verifiedUser.name,
        username: verifiedUser.username,
        email: verifiedUser.email,
        avatarUrl: verifiedUser.avatarUrl,
        isVerified: true,
        createdAt: verifiedUser.createdAt
      },
      token
    };
  }

  static async resendVerificationCode(email) {
    if (!email) {
      const error = new Error('Email is required.');
      error.status = 400;
      throw error;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const error = new Error('No account found with this email address.');
      error.status = 404;
      throw error;
    }

    if (user.isVerified) {
      return {
        success: true,
        alreadyVerified: true,
        message: 'This account is already verified. You can proceed to log in.'
      };
    }

    const verificationCode = this.generateVerificationCode();
    const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationCodeExpiresAt
      }
    });

    await EmailService.sendVerificationEmail(user.email, verificationCode, user.name);

    return {
      success: true,
      message: 'A fresh 6-digit verification code has been sent to your email.'
    };
  }

  static async handleGoogleUser({ googleId, email, name, avatarUrl }) {
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email }
        ]
      }
    });

    if (user) {
      // Google accounts are verified by Google identity provider
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleId || user.googleId,
          isVerified: true,
          avatarUrl: avatarUrl || user.avatarUrl
        }
      });
    } else {
      // Create fresh Google user (pre-verified by Google)
      let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
      let uniqueUsername = baseUsername;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username: uniqueUsername } })) {
        uniqueUsername = `${baseUsername}${counter}`;
        counter++;
      }

      user = await prisma.user.create({
        data: {
          name: name || uniqueUsername,
          username: uniqueUsername,
          email,
          googleId,
          isVerified: true,
          avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(uniqueUsername)}`
        }
      });
    }

    const token = this.generateToken(user);
    return {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      },
      token
    };
  }

  static async getCurrentUser(userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true
      }
    });
  }

  static async updateProfile(userId, { name, username, avatarUrl }) {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    if (username && username !== existing.username) {
      const taken = await prisma.user.findUnique({ where: { username } });
      if (taken) {
        const error = new Error('Username already taken. Please choose another.');
        error.status = 409;
        throw error;
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name ? { name } : {}),
        ...(username ? { username } : {}),
        ...(avatarUrl ? { avatarUrl } : {})
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true
      }
    });

    const token = this.generateToken(updated);
    return { user: updated, token };
  }

  static async requestPasswordReset(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const error = new Error('No account found with this email address.');
      error.status = 404;
      throw error;
    }

    const resetCode = this.generateVerificationCode();
    const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: resetCode,
        verificationCodeExpiresAt
      }
    });

    try {
      await EmailService.sendPasswordResetEmail(user.email, resetCode, user.name);
    } catch (err) {
      console.error('[AuthService] Failed to send password reset email:', err);
    }

    return {
      success: true,
      message: 'Password reset code has been sent to your email.',
      email
    };
  }

  static async resetPassword(email, code, newPassword) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const error = new Error('No account found with this email address.');
      error.status = 404;
      throw error;
    }

    if (!user.verificationCode || user.verificationCode.trim() !== code.trim()) {
      const error = new Error('Invalid reset code.');
      error.status = 400;
      throw error;
    }

    if (user.verificationCodeExpiresAt && new Date() > new Date(user.verificationCodeExpiresAt)) {
      const error = new Error('Reset code has expired. Please request a new one.');
      error.status = 400;
      throw error;
    }

    if (!newPassword || newPassword.length < 8) {
      const error = new Error('Password must be at least 8 characters.');
      error.status = 400;
      throw error;
    }

    const passwordHash = await this.hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        verificationCode: null,
        verificationCodeExpiresAt: null
      }
    });

    return { success: true, message: 'Password has been reset successfully. You can now log in.' };
  }
}
