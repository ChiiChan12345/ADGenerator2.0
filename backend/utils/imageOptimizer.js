let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.warn('Sharp not available, image optimization disabled:', error.message);
  sharp = null;
}
const logger = require('./logger');
const constants = require('../config/constants');

/**
 * Optimize uploaded images before processing
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {string} mimetype - Original image mimetype
 * @returns {Promise<{buffer: Buffer, mimetype: string, metadata: object}>}
 */
async function optimizeImage(imageBuffer, mimetype) {
  const startTime = Date.now();

  // If Sharp is not available, return original buffer
  if (!sharp) {
    logger.warn('Sharp not available, skipping image optimization');
    return {
      buffer: imageBuffer,
      mimetype,
      metadata: {
        error: 'Sharp not available, using original',
        processingTime: Date.now() - startTime,
      },
    };
  }

  try {
    // Get original image metadata
    const originalMetadata = await sharp(imageBuffer).metadata();
    logger.debug('Original image metadata', {
      width: originalMetadata.width,
      height: originalMetadata.height,
      format: originalMetadata.format,
      size: originalMetadata.size,
    });

    // Define optimization settings
    const maxWidth = 1920;
    const maxHeight = 1920;
    const quality = 85;

    // Create sharp instance with optimization
    let sharpInstance = sharp(imageBuffer).resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    // Apply format-specific optimizations
    let outputBuffer;
    let outputMimetype = 'image/jpeg'; // Default to JPEG for better compression

    if (mimetype.includes('png')) {
      // For PNG, try to convert to JPEG if no transparency
      if (!originalMetadata.hasAlpha) {
        outputBuffer = await sharpInstance
          .jpeg({
            quality,
            progressive: true,
            mozjpeg: true,
          })
          .toBuffer();
      } else {
        // Keep as PNG if has transparency
        outputBuffer = await sharpInstance
          .png({
            quality,
            compressionLevel: 6,
            adaptiveFiltering: false,
          })
          .toBuffer();
        outputMimetype = 'image/png';
      }
    } else if (mimetype.includes('webp')) {
      outputBuffer = await sharpInstance
        .webp({
          quality,
          effort: 4,
        })
        .toBuffer();
      outputMimetype = 'image/webp';
    } else {
      // Default to JPEG
      outputBuffer = await sharpInstance
        .jpeg({
          quality,
          progressive: true,
          mozjpeg: true,
        })
        .toBuffer();
    }

    // Get optimized metadata
    const optimizedMetadata = await sharp(outputBuffer).metadata();
    const processingTime = Date.now() - startTime;
    const compressionRatio = (
      ((originalMetadata.size - optimizedMetadata.size) / originalMetadata.size) *
      100
    ).toFixed(1);

    logger.info('Image optimization completed', {
      originalSize: originalMetadata.size,
      optimizedSize: optimizedMetadata.size,
      compressionRatio: `${compressionRatio}%`,
      processingTimeMs: processingTime,
      dimensions: `${optimizedMetadata.width}x${optimizedMetadata.height}`,
    });

    return {
      buffer: outputBuffer,
      mimetype: outputMimetype,
      metadata: {
        original: originalMetadata,
        optimized: optimizedMetadata,
        compressionRatio,
        processingTime,
      },
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error('Image optimization failed:', {
      error: error.message,
      processingTimeMs: processingTime,
      originalMimetype: mimetype,
    });

    // Return original buffer if optimization fails
    return {
      buffer: imageBuffer,
      mimetype,
      metadata: {
        error: 'Optimization failed, using original',
        processingTime,
      },
    };
  }
}

/**
 * Generate thumbnail for quick preview
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Buffer>}
 */
async function generateThumbnail(imageBuffer) {
  // If Sharp is not available, return null
  if (!sharp) {
    logger.warn('Sharp not available, skipping thumbnail generation');
    return null;
  }

  try {
    return await sharp(imageBuffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 70 })
      .toBuffer();
  } catch (error) {
    logger.error('Thumbnail generation failed:', error);
    throw error;
  }
}

module.exports = {
  optimizeImage,
  generateThumbnail,
};
