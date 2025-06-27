console.log('--- Starting ADGenerator2.0 backend/server.js ---');

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});

require('dotenv').config();
console.log('Loaded environment variables');
const express = require('express');
console.log('Imported express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const slowDown = require('express-slow-down');
const logger = require('./utils/logger');
const constants = require('./config/constants');
console.log('Imported all dependencies');

const app = express();
console.log('Initialized Express app');
const PORT = process.env.PORT || 3000;

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: constants.RATE_LIMIT_WINDOW,
  max: constants.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many API requests from this IP, please try again later.',
    retryAfter: Math.ceil(constants.RATE_LIMIT_WINDOW / 1000 / 60), // minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Slow down configuration for additional protection
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 5, // Allow 5 requests per windowMs without delay
  delayMs: () => 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  validate: { delayMs: false }, // Disable deprecation warning
});

// Security headers configuration
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.openai.com', 'https://api.ideogram.ai'],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for compatibility
};

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Security middleware
app.use(helmet(helmetConfig));
app.use(compression());

// CORS and parsing middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting and slow down to all API routes
app.use('/api/', speedLimiter);
app.use('/api/', apiLimiter);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// Serve static frontend
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Health check endpoint
const { performHealthCheck } = require('./utils/health-check');
app.get('/health', async (req, res) => {
  try {
    const health = await performHealthCheck();
    const statusCode =
      health.status === 'healthy'
        ? 200
        : health.status === 'warning' || health.status === 'degraded'
          ? 503
          : 500;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// API routes
const apiRouter = require('./routes/api');
app.use('/api', apiRouter);

// Fallback to frontend for any other route
app.get('*', (req, res) => {
  logger.debug(`Serving frontend for ${req.url}`);
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Request error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error.',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Place a log before app.listen
if (process.env.NODE_ENV !== 'test') {
  console.log('About to call app.listen...');
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info('CORS enabled for:', corsOptions.origin);
  });
}

// Export app for testing
module.exports = app;
