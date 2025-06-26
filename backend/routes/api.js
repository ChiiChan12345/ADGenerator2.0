const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { processImage, exportZipFromUrls } = require('../controllers/processController');

// Multer config for file upload validation
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (PNG, JPG, JPEG, GIF, WEBP).'));
    }
  }
});

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

// POST /api/process
router.post('/process', 
  upload.array('image', 10),
  handleMulterError,
  async (req, res, next) => {
    try {
      console.log(`[${new Date().toISOString()}] /api/process called`);
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded.' });
      }
      
      req.files.forEach(file => {
        console.log(`Uploaded file: name=${file.originalname}, type=${file.mimetype}, size=${file.size}`);
      });
      
      await processImage(req, res, next);
    } catch (error) {
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

module.exports = router; 