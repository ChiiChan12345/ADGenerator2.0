const axios = require('axios');
const sanitizeHtml = require('sanitize-html');
const FormData = require('form-data');
const JSZip = require('jszip');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const IDEOGRAM_API_KEY = process.env.IDEOGRAM_API_KEY;

// Helper: call OpenAI Chat Completions API for 16 marketing prompts
async function callOpenAI(imageBuffer, imageMimetype, prompt) {
  console.log(`[${new Date().toISOString()}] Calling OpenAI API...`);
  const imageBase64 = imageBuffer.toString('base64');
  const messages = [
    {
      role: 'system',
      content: 'You are a marketer and image analyst. You will be given an image and a prompting Guide for Ideogram. Analyze the image in detail, Look for for Call to action in the image.  then generate 16 distinct, creative, and marketable prompts for generating new images inspired by the original. You will be given age group of viewers. prompt must be made that are more likely to convert for that age group. Each prompt should be unique, and must adhere to magic prompt guidelines. Output ONLY the 16 prompts as a valid JSON array, and nothing else.'
    },
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:${imageMimetype};base64,${imageBase64}` } }
      ]
    }
  ];
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o',
      messages,
      max_tokens: 3000,
      temperature: .7,
      top_p: 1,
      presence_penalty: 0,
      frequency_penalty: 0
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  console.log(`[${new Date().toISOString()}] OpenAI API response received.`);
  let rawContent = response.data.choices[0].message.content;
  console.log('Raw OpenAI response:', rawContent);
  // Remove Markdown code block if present
  if (rawContent.trim().startsWith('```')) {
    rawContent = rawContent.replace(/^```[a-zA-Z]*\n/, '').replace(/```$/, '').trim();
  }
  let prompts;
  try {
    prompts = JSON.parse(rawContent);
    if (!Array.isArray(prompts) || prompts.length !== 16) throw new Error('Not 16 prompts');
  } catch (e) {
    console.error('Failed to parse 16 prompts from OpenAI response:', e.message);
    console.error('Sanitized OpenAI response:', rawContent);
    throw new Error('Failed to parse 16 prompts from OpenAI response.');
  }
  return prompts;
}

// Helper: call Ideogram Generate-V3 API for a single prompt
async function callIdeogram(prompt) {
  console.log(`[${new Date().toISOString()}] Calling Ideogram API with prompt:`, prompt);
  const form = new FormData();
  form.append('prompt', prompt);
  form.append('rendering_speed', 'TURBO');
  form.append('magic_prompt', 'ON');
  const response = await axios.post(
    'https://api.ideogram.ai/v1/ideogram-v3/generate',
    form,
    {
      headers: {
        ...form.getHeaders(),
        'Api-Key': IDEOGRAM_API_KEY,
      },
      maxBodyLength: Infinity,
    }
  );
  console.log(`[${new Date().toISOString()}] Ideogram API response:`, JSON.stringify(response.data, null, 2));
  const urls = (response.data.data || []).map(img => img.url);
  console.log(`[${new Date().toISOString()}] Extracted URLs:`, urls);
  return urls;
}

// Controller
exports.processImage = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const prompt = req.body.prompt || '';
    const results = [];
    const prompts = [];

    // Process each file in parallel
    await Promise.all(files.map(async (file) => {
      try {
        const filePrompts = await callOpenAI(file.buffer, file.mimetype, prompt);
        prompts.push(...filePrompts);
        
        // Generate images for each prompt
        for (const prompt of filePrompts) {
          const imageUrls = await callIdeogram(prompt);
          results.push(...imageUrls);
        }
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        throw error;
      }
    }));

    res.json({ results, prompts });
  } catch (error) {
    console.error('Error processing images:', error);
    res.status(500).json({ error: error.message || 'Error processing images.' });
  }
};

// Controller: Export images as zip from URLs
exports.exportZipFromUrls = async (req, res) => {
  try {
    const urls = req.body.urls;
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'No image URLs provided.' });
    }

    console.log(`[${new Date().toISOString()}] Starting zip export for ${urls.length} images`);
    const zip = new JSZip();
    const folder = zip.folder('ADGenerator2.0-images');

    // Download images in parallel
    const downloadPromises = urls.map(async (url, idx) => {
      try {
        console.log(`[${new Date().toISOString()}] Downloading image ${idx + 1} from ${url}`);
        const response = await axios.get(url, { 
          responseType: 'arraybuffer',
          timeout: 30000 // 30 second timeout
        });
        const ext = url.split('.').pop().split('?')[0] || 'jpg';
        folder.file(`image_${idx + 1}.${ext}`, response.data);
        console.log(`[${new Date().toISOString()}] Successfully downloaded image ${idx + 1}`);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error downloading image ${idx + 1}:`, error.message);
        // Continue with other images even if one fails
      }
    });

    await Promise.all(downloadPromises);
    console.log(`[${new Date().toISOString()}] All images downloaded, generating zip file`);

    const content = await zip.generateAsync({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    console.log(`[${new Date().toISOString()}] Zip file generated, sending response`);
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="ADGenerator2.0-images.zip"',
    });
    res.send(content);
  } catch (err) {
    console.error(`