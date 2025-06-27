// Configuration constants for ADGenerator2.0
module.exports = {
  // File upload limits
  FILE_SIZE_LIMIT: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 10,

  // API configuration
  API_TIMEOUT: 30000, // 30 seconds
  PROMPTS_COUNT: 16,

  // Supported file types
  SUPPORTED_IMAGE_TYPES: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],

  // Rate limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 10,

  // OpenAI configuration
  OPENAI_MODEL: 'gpt-4o',
  OPENAI_MAX_TOKENS: 3000,
  OPENAI_TEMPERATURE: 0.7,

  // Ideogram configuration
  IDEOGRAM_RENDERING_SPEED: 'TURBO',
  IDEOGRAM_MAGIC_PROMPT: 'ON',

  // Zip export
  ZIP_COMPRESSION_LEVEL: 9,
};
