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

const app = express();
const server = http.createServer(app);

// Security & Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const allowedOrigins = [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'];
const isOriginAllowed = (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
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
