import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  confirmPassword: z.string().min(6)
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const createRoomSchema = z.object({
  name: z.string().min(2, 'Room name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  language: z.enum(['cpp', 'c', 'python']).default('cpp'),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC')
});

export const joinRoomSchema = z.object({
  roomCode: z.string().min(4, 'Room code must be at least 4 characters')
});

export const createFileSchema = z.object({
  roomId: z.string().uuid('Valid room ID required'),
  name: z.string().min(1, 'File name is required').max(100).regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid file name'),
  path: z.string().min(1),
  content: z.string().optional()
});

export const updateFileSchema = z.object({
  content: z.string()
});

export const renameFileSchema = z.object({
  name: z.string().min(1, 'New file name is required').max(100).regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid file name')
});

export const executionSchema = z.object({
  roomId: z.string().uuid('Valid room ID required'),
  fileId: z.string().uuid().optional(),
  language: z.string().default('cpp'),
  code: z.string().min(1, 'Source code cannot be empty').max(64000, 'Source code exceeds maximum size (64KB)'),
  stdin: z.string().max(16000, 'Standard input exceeds maximum size (16KB)').optional()
});

export const chatSchema = z.object({
  roomId: z.string().uuid('Valid room ID required'),
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message cannot exceed 2000 characters')
});
