import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/index.js';
import connectDB from './config/database.js';
import { errorHandler, notFound } from './api/middleware/errorHandler.js';
import { apiLimiter } from './api/middleware/rateLimiter.js';

// Route imports
import authRoutes from './api/routes/authRoutes.js';
import jobRoutes from './api/routes/jobRoutes.js';
import candidateRoutes from './api/routes/candidateRoutes.js';
import interviewRoutes from './api/routes/interviewRoutes.js';
import hrRoutes from './api/routes/hrRoutes.js';
import rlhfRoutes from './api/routes/rlhfRoutes.js';
import adminRoutes from './api/routes/adminRoutes.js';

const app = express();

// ═══════════════════════════════════════════
// MIDDLEWARE STACK
// ═══════════════════════════════════════════

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: [config.appUrl, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Global rate limit
app.use('/api/', apiLimiter);

// ═══════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/rlhf', rlhfRoutes);
app.use('/api/admin', adminRoutes);

// ═══════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════

app.use(notFound);
app.use(errorHandler);

// ═══════════════════════════════════════════
// SERVER START
// ═══════════════════════════════════════════

const startServer = async () => {
  try {
    await connectDB();

    app.listen(config.port, () => {
      console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   🚀 HireNode Server Running                ║
║   📍 Port: ${config.port}                            ║
║   🌍 Env: ${config.nodeEnv.padEnd(14)}             ║
║   📦 API: ${config.apiUrl}/api               ║
║                                              ║
╚══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

export default app;
