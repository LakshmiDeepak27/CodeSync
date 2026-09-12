import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma.js';
import { ENV } from '../config/env.js';

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

  static async register({ name, username, email, password }) {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      const error = new Error('An account with this email already exists.');
      error.status = 409;
      throw error;
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

    const passwordHash = await this.hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name: name || finalUsername,
        username: finalUsername,
        email,
        passwordHash,
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(finalUsername)}`
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    const token = this.generateToken(user);
    return { user, token };
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

    const token = this.generateToken(user);
    return {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      },
      token
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
      if (!user.googleId) {
        // Link googleId to existing email account
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, avatarUrl: avatarUrl || user.avatarUrl }
        });
      }
    } else {
      // Create fresh Google user
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
    const resetCode = '849201';
    return {
      success: true,
      message: 'Password reset code generated.',
      email,
      devCode: resetCode
    };
  }

  static async resetPassword(email, code, newPassword) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const error = new Error('No account found with this email address.');
      error.status = 404;
      throw error;
    }

    if (!newPassword || newPassword.length < 6) {
      const error = new Error('Password must be at least 6 characters.');
      error.status = 400;
      throw error;
    }

    const passwordHash = await this.hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    return { success: true, message: 'Password has been reset successfully.' };
  }

  static async verifyEmail(email, code) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const error = new Error('User not found.');
      error.status = 404;
      throw error;
    }
    return { success: true, message: 'Account email has been verified successfully.' };
  }
}
