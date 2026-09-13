import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Server as SocketIOServer } from 'socket.io';
import { YSocketIO } from 'y-socket.io/dist/server';
import { ENV } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { setupSocketIO } from './sockets/index.js';
import { prisma } from './services/prisma.js';
import * as Y from 'yjs';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

const app = express();
const server = http.createServer(app);

// Trust reverse proxy (Render, Cloudflare, AWS, etc.) for secure cookies & client IP
app.set('trust proxy', 1);

// Security & Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

const configuredOrigins = (ENV.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://localhost:8080'
];

const allowedOrigins = [...new Set([...configuredOrigins, ...defaultAllowedOrigins])];

const isOriginAllowed = (origin, callback) => {
  if (
    !origin ||
    allowedOrigins.includes(origin) ||
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
    /https:\/\/.*\.onrender\.com$/.test(origin) ||
    /https:\/\/.*\.vercel\.app$/.test(origin)
  ) {
    callback(null, true);
  } else {
    callback(new Error(`CORS blocked for origin: ${origin}`));
  }
};

app.use(cors({
  origin: isOriginAllowed,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'codesync-server', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', apiRoutes);

// In production, serve compiled Vite React SPA if present (allows unified 0-cost single-service deployment)
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error Handling Middleware
app.use(errorHandler);

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: isOriginAllowed,
    credentials: true
  },
  pingTimeout: 20000,
  pingInterval: 10000
});

const ySocketIO = new YSocketIO(io);
ySocketIO.initialize();

// Seed initial files for newly loaded rooms so all clients share the exact same Y.Text instances
ySocketIO.on('document-loaded', async (doc) => {
  try {
    const yFiles = doc.getMap('files');
    if (yFiles.size === 0) {
      const roomId = doc.name;
      const room = await prisma.room.findFirst({
        where: {
          OR: [{ id: roomId }, { roomCode: roomId.toUpperCase() }]
        },
        include: { files: true }
      });
      if (room?.files && room.files.length > 0) {
        room.files.forEach((f) => {
          if (!yFiles.has(f.name)) {
            const text = new Y.Text(f.content || '');
            yFiles.set(f.name, text);
          }
        });
      } else {
        const text = new Y.Text(
          '#include <iostream>\n\nint main() {\n    std::cout << "Hello, CodeSync!" << std::endl;\n    return 0;\n}\n'
        );
        yFiles.set('main.cpp', text);
      }
    }
  } catch (err) {
    console.error('[Yjs] Error initializing document:', err);
  }
});

setupSocketIO(io);

// Start Server
server.listen(ENV.PORT, () => {
  console.log(`[CodeSync Server] Running on http://localhost:${ENV.PORT}`);
  console.log(`[CodeSync Server] Connected to MySQL on ${ENV.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`[CodeSync Server] Judge0 endpoint: ${ENV.JUDGE0_BASE_URL}`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down server gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// CodeSync server initialized
