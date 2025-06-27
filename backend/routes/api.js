const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const constants = require('../config/constants');
const progressTracker = require('../utils/progressTracker');
const { processImage, exportZipFromUrls } = require('../controllers/processController');

// Multer config for file upload validation
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: constants.FILE_SIZE_LIMIT },
  fileFilter: (req, file, cb) => {
    if (constants.SUPPORTED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error(
        `Only image files are allowed (${constants.SUPPORTED_IMAGE_TYPES.join(', ')}).`
      );
      error.code = 'UNSUPPORTED_FILE_TYPE';
      cb(error);
    }
  },
});

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxSizeMB = constants.FILE_SIZE_LIMIT / (1024 * 1024);
      logger.warn(`File size exceeded: ${err.message}`, { ip: req.ip });
      return res
        .status(400)
        .json({ error: `File size too large. Maximum size is ${maxSizeMB}MB.` });
    }
    logger.warn(`Multer error: ${err.message}`, { ip: req.ip });
    return res.status(400).json({ error: err.message });
  }

  // Handle custom file filter errors
  if (err.code === 'UNSUPPORTED_FILE_TYPE') {
    logger.warn(`Unsupported file type: ${err.message}`, { ip: req.ip });
    return res.status(400).json({ error: err.message });
  }

  next(err);
};

// Validation middleware for prompt
const validatePrompt = [
  body('prompt')
    .isLength({ min: 10, max: 10000 })
    .withMessage('Prompt must be between 10 and 10000 characters')
    .escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation failed:', { errors: errors.array(), ip: req.ip });
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }
    next();
  },
];

// POST /api/process
router.post(
  '/process',
  upload.array('image', constants.MAX_FILES),
  handleMulterError,
  validatePrompt,
  async (req, res, next) => {
    try {
      logger.info('/api/process called', {
        filesCount: req.files?.length || 0,
        ip: req.ip,
      });

      if (!req.files || req.files.length === 0) {
        logger.warn('No files uploaded', { ip: req.ip });
        return res.status(400).json({ error: 'No files uploaded.' });
      }

      req.files.forEach(file => {
        logger.debug('File uploaded:', {
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
          ip: req.ip,
        });
      });

      await processImage(req, res, next);
    } catch (error) {
      logger.error('Process route error:', error);
      next(error);
    }
  }
);

// POST /api/export-zip
router.post('/export-zip', async (req, res, next) => {
  try {
    await exportZipFromUrls(req, res, next);
  } catch (error) {
    next(error);
  }
});

// GET /api/progress/:taskId - Server-Sent Events for progress tracking
router.get('/progress/:taskId', (req, res) => {
  const taskId = req.params.taskId;

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Add connection to progress tracker
  progressTracker.addConnection(taskId, res);

  // Handle client disconnect
  res.on('close', () => {
    progressTracker.removeConnection(taskId, res);
    logger.debug('SSE connection closed', { taskId });
  });

  res.on('error', error => {
    progressTracker.removeConnection(taskId, res);
    logger.error('SSE connection error', { taskId, error: error.message });
  });

  // Send initial ping
  res.write('data: {"type":"connected"}\n\n');

  logger.debug('SSE connection established', { taskId });
});

// GET /api/progress/:taskId/status - Get current progress status
router.get('/progress/:taskId/status', (req, res) => {
  const taskId = req.params.taskId;
  const task = progressTracker.getTask(taskId);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json(task);
});

module.exports = router;
