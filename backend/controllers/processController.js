const axios = require('axios');
const sanitizeHtml = require('sanitize-html');
const FormData = require('form-data');
const JSZip = require('jszip');
const logger = require('../utils/logger');
const constants = require('../config/constants');
const cache = require('../utils/cache');
const { optimizeImage } = require('../utils/imageOptimizer');
const progressTracker = require('../utils/progressTracker');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const IDEOGRAM_API_KEY = process.env.IDEOGRAM_API_KEY;

// Helper: call OpenAI Chat Completions API for marketing prompts
async function callOpenAI(imageBuffer, imageMimetype, prompt) {
  logger.info('Calling OpenAI API...');
  const imageBase64 = imageBuffer.toString('base64');
  const messages = [
    {
      role: 'system',
      content: `You are a marketer and image analyst. You will be given an image and a prompting Guide for Ideogram. Analyze the image in detail, Look for for Call to action in the image. then generate ${constants.PROMPTS_COUNT} distinct, creative, and marketable prompts for generating new images inspired by the original. You will be given age group of viewers. prompt must be made that are more likely to convert for that age group. Each prompt should be unique, and must adhere to magic prompt guidelines. Output ONLY the ${constants.PROMPTS_COUNT} prompts as a valid JSON array, and nothing else.`
    },
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:${imageMimetype};base64,${imageBase64}` } }
      ]
    }
  ];
  
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: constants.OPENAI_MODEL,
        messages,
        max_tokens: constants.OPENAI_MAX_TOKENS,
        temperature: constants.OPENAI_TEMPERATURE,
        top_p: 1,
        presence_penalty: 0,
        frequency_penalty: 0
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: constants.API_TIMEOUT
      }
    );
    
    logger.info('OpenAI API response received');
    let rawContent = response.data.choices[0].message.content;
    logger.debug('Raw OpenAI response received', { length: rawContent.length });
    
    // Remove Markdown code block if present
    if (rawContent.trim().startsWith('```')) {
      rawContent = rawContent.replace(/^```[a-zA-Z]*\n/, '').replace(/```$/, '').trim();
    }
    
    let prompts;
    try {
      prompts = JSON.parse(rawContent);
      if (!Array.isArray(prompts) || prompts.length !== constants.PROMPTS_COUNT) {
        throw new Error(`Expected ${constants.PROMPTS_COUNT} prompts, got ${prompts?.length || 0}`);
      }
    } catch (e) {
      logger.error('Failed to parse prompts from OpenAI response:', {
        error: e.message,
        rawContentLength: rawContent.length,
        rawContentPreview: rawContent.substring(0, 200)
      });
      throw new Error('Failed to parse prompts from OpenAI response.');
    }
    
    return prompts;
  } catch (error) {
    logger.error('OpenAI API error:', {
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    throw error;
  }
}

// Helper: call Ideogram Generate-V3 API for a single prompt
async function callIdeogram(prompt) {
  logger.info('Calling Ideogram API', { promptLength: prompt.length });
  
  try {
    const form = new FormData();
    form.append('prompt', prompt);
    form.append('rendering_speed', constants.IDEOGRAM_RENDERING_SPEED);
    form.append('magic_prompt', constants.IDEOGRAM_MAGIC_PROMPT);
    
    const response = await axios.post(
      'https://api.ideogram.ai/v1/ideogram-v3/generate',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Api-Key': IDEOGRAM_API_KEY,
        },
        maxBodyLength: Infinity,
        timeout: constants.API_TIMEOUT
      }
    );
    
    logger.info('Ideogram API response received', { 
      imageCount: response.data.data?.length || 0 
    });
    logger.debug('Ideogram API full response', { 
      response: JSON.stringify(response.data, null, 2) 
    });
    
    const urls = (response.data.data || []).map(img => img.url);
    logger.info('Extracted image URLs', { urlCount: urls.length });
    
    return urls;
  } catch (error) {
    logger.error('Ideogram API error:', {
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      promptLength: prompt.length
    });
    throw error;
  }
}

// Async function to process images in background with progress tracking
async function processImagesInBackground(taskId, files, prompt) {
  const startTime = Date.now();
  const results = [];
  const prompts = [];
  
  try {
    progressTracker.updateProgress(taskId, {
      currentStep: 1,
      message: 'Initializing image processing...'
    });

    // Process each file with progress updates
    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const file = files[fileIndex];
      
      try {
        progressTracker.updateProgress(taskId, {
          currentStep: (fileIndex * (constants.PROMPTS_COUNT + 1)) + 1,
          message: `Processing file ${fileIndex + 1}/${files.length}: ${file.originalname}`
        });
        
        logger.info(`Processing file ${fileIndex + 1}/${files.length}`, { 
          filename: file.originalname,
          originalSize: file.size
        });
        
        // Optimize image first
        progressTracker.updateProgress(taskId, {
          message: `Optimizing image ${fileIndex + 1}...`
        });
        
        const optimized = await optimizeImage(file.buffer, file.mimetype);
        logger.info('Image optimization result', optimized.metadata);
        
        // Check cache for existing results
        const cacheKey = cache.generateImageCacheKey(optimized.buffer, prompt);
        const cachedResult = await cache.get(cacheKey);
        
        if (cachedResult) {
          logger.info(`Cache hit for file ${fileIndex + 1}`, { cacheKey });
          prompts.push(...cachedResult.prompts);
          results.push(...cachedResult.results);
          
          progressTracker.updateProgress(taskId, {
            currentStep: (fileIndex + 1) * (constants.PROMPTS_COUNT + 1),
            message: `Used cached results for ${file.originalname}`
          });
          continue;
        }
        
        // Generate prompts with OpenAI
        progressTracker.updateProgress(taskId, {
          message: `Generating marketing prompts for ${file.originalname}...`
        });
        
        const filePrompts = await callOpenAI(optimized.buffer, optimized.mimetype, prompt);
        prompts.push(...filePrompts);
        
        // Generate images for each prompt
        for (let promptIndex = 0; promptIndex < filePrompts.length; promptIndex++) {
          const promptText = filePrompts[promptIndex];
          
          progressTracker.updateProgress(taskId, {
            currentStep: (fileIndex * (constants.PROMPTS_COUNT + 1)) + promptIndex + 2,
            message: `Generating image ${promptIndex + 1}/${filePrompts.length} for ${file.originalname}...`
          });
          
          try {
            logger.debug(`Generating image ${promptIndex + 1}/${filePrompts.length} for file ${fileIndex + 1}`);
            const imageUrls = await callIdeogram(promptText);
            results.push(...imageUrls);
          } catch (error) {
            logger.error(`Error generating image for prompt ${promptIndex + 1}:`, {
              error: error.message,
              promptText: promptText.substring(0, 100)
            });
            // Continue with other prompts
          }
        }
        
        // Cache the results for future use (24 hour TTL)
        await cache.set(cacheKey, {
          prompts: filePrompts,
          results: results.slice(-filePrompts.length * 2), // Rough estimate of new results
          metadata: optimized.metadata
        }, 24 * 3600);
        
        logger.info(`Completed processing file ${fileIndex + 1}`, { 
          generatedImages: results.length,
          cached: true
        });
        
      } catch (error) {
        logger.error(`Error processing file ${file.originalname}:`, {
          error: error.message,
          stack: error.stack
        });
        
        progressTracker.updateProgress(taskId, {
          message: `Error processing ${file.originalname}: ${error.message}`
        });
      }
    }

    const processingTime = Date.now() - startTime;
    logger.info('Image processing completed', { 
      totalResults: results.length, 
      totalPrompts: prompts.length,
      processingTimeMs: processingTime
    });

    // Complete the task
    progressTracker.completeTask(taskId, { 
      results, 
      prompts,
      processingTime,
      totalImages: results.length
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error('Error processing images:', {
      error: error.message,
      stack: error.stack,
      processingTimeMs: processingTime
    });
    
    progressTracker.failTask(taskId, error);
  }
}

// Controller
exports.processImage = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      logger.warn('No files uploaded in request');
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const prompt = req.body.prompt || '';
    logger.info('Starting image processing', { 
      fileCount: files.length, 
      promptLength: prompt.length 
    });

    // Create progress tracking task
    const taskId = progressTracker.generateTaskId();
    const totalSteps = files.length * (constants.PROMPTS_COUNT + 1);
    progressTracker.createTask(taskId, {
      totalSteps,
      filesCount: files.length,
      promptsPerFile: constants.PROMPTS_COUNT
    });
    
    // Return task ID immediately so client can track progress
    res.json({ 
      taskId,
      message: 'Processing started. Use /api/progress/' + taskId + ' to track progress.',
      estimatedTime: `${Math.ceil(totalSteps * 2)} seconds`
    });
    
    // Continue processing in background
    processImagesInBackground(taskId, files, prompt);
    
  } catch (error) {
    logger.error('Error starting image processing:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: error.message || 'Error starting image processing.' });
  }
};

// Controller: Export images as zip from URLs
exports.exportZipFromUrls = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const urls = req.body.urls;
    if (!Array.isArray(urls) || urls.length === 0) {
      logger.warn('No image URLs provided for zip export');
      return res.status(400).json({ error: 'No image URLs provided.' });
    }

    logger.info('Starting zip export', { imageCount: urls.length });
    const zip = new JSZip();
    const folder = zip.folder('ADGenerator2.0-images');

    // Download images in parallel
    const downloadPromises = urls.map(async (url, idx) => {
      try {
        logger.debug(`Downloading image ${idx + 1}/${urls.length}`, { url });
        const response = await axios.get(url, { 
          responseType: 'arraybuffer',
          timeout: constants.API_TIMEOUT
        });
        const ext = url.split('.').pop().split('?')[0] || 'jpg';
        folder.file(`image_${idx + 1}.${ext}`, response.data);
        logger.debug(`Successfully downloaded image ${idx + 1}/${urls.length}`);
      } catch (error) {
        logger.error(`Error downloading image ${idx + 1}:`, {
          error: error.message,
          url,
          status: error.response?.status
        });
        // Continue with other images even if one fails
      }
    });

    await Promise.all(downloadPromises);
    logger.info('All images downloaded, generating zip file');

    const content = await zip.generateAsync({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: constants.ZIP_COMPRESSION_LEVEL }
    });

    const processingTime = Date.now() - startTime;
    logger.info('Zip file generated successfully', { 
      sizeBytes: content.length,
      processingTimeMs: processingTime
    });
    
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="ADGenerator2.0-images.zip"',
    });
    res.send(content);
  } catch (err) {
    const processingTime = Date.now() - startTime;
    logger.error('Error exporting zip:', {
      error: err.message,
      stack: err.stack,
      processingTimeMs: processingTime
    });
    res.status(500).json({ error: 'Failed to export zip.' });
  }
};
