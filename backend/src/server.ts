import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './routes/auth';
import { createChatRouter } from './routes/chat';
import recommendationsRouter from './routes/recommendations';
import dashboardRouter from './routes/dashboard';
import marketplaceRouter from './routes/marketplace';
import behavioralRouter from './routes/behavioral';
import db from './database/store';
import jwt from 'jsonwebtoken';

const app = express();
const httpServer = createServer(app);
const PORT = parseInt(process.env.PORT || '3001');
const JWT_SECRET = process.env.JWT_SECRET || 'dhansetu-secret-dev-key';

// Socket.IO
const io = new SocketServer(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'DhanSetu API', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/chat', createChatRouter(io));
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/behavioral', behavioralRouter);

// Error handler
app.use(errorHandler);

// Socket.IO connection handling
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    next(new Error('Authentication required'));
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    (socket as { userId?: string }).userId = decoded.userId;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = (socket as { userId?: string }).userId;
  if (!userId) return;

  console.log(`[Socket] User connected: ${userId}`);
  socket.join(`user:${userId}`);

  socket.on('ping_workflow', () => {
    const session = db.getLatestUserSession(userId);
    if (session) {
      const state = db.getWorkflowState(session.id);
      socket.emit('workflow_status', { stage: state?.currentStage || 'welcome', completedStages: state?.completedStages || [] });
    }
  });

  socket.on('track_signal', (data) => {
    db.trackSignal({ userId, ...data });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${userId}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║     🏦 DhanSetu Backend Running      ║
║     Port: ${PORT}                       ║
║     Environment: ${process.env.NODE_ENV || 'development'}          ║
╚═══════════════════════════════════════╝
  `);
});

export { io };
