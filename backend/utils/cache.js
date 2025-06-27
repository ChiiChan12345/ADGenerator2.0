const Redis = require('ioredis');
const logger = require('./logger');

let redisClient = null;
let isConnected = false;

// Initialize Redis connection
function initializeRedis() {
  if (redisClient) {
    return redisClient;
  }

  try {
    // Try to connect to Redis (optional, fallback to in-memory if not available)
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
      isConnected = true;
    });

    redisClient.on('error', err => {
      logger.warn('Redis connection error, falling back to in-memory cache:', err.message);
      isConnected = false;
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
      isConnected = false;
    });

    return redisClient;
  } catch (error) {
    logger.warn('Redis initialization failed, using in-memory cache:', error.message);
    return null;
  }
}

// In-memory cache fallback
const memoryCache = new Map();
const cacheExpiry = new Map();
const MAX_MEMORY_CACHE_SIZE = 100;

// Clean expired items from memory cache
function cleanMemoryCache() {
  const now = Date.now();
  for (const [key, expireTime] of cacheExpiry.entries()) {
    if (now > expireTime) {
      memoryCache.delete(key);
      cacheExpiry.delete(key);
    }
  }

  // Limit cache size
  if (memoryCache.size > MAX_MEMORY_CACHE_SIZE) {
    const entries = Array.from(memoryCache.keys());
    const toDelete = entries.slice(0, entries.length - MAX_MEMORY_CACHE_SIZE);
    toDelete.forEach(key => {
      memoryCache.delete(key);
      cacheExpiry.delete(key);
    });
  }
}

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any>} - Cached value or null
 */
async function get(key) {
  try {
    // Try Redis first
    if (redisClient && isConnected) {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    }

    // Fallback to memory cache
    cleanMemoryCache();
    const expireTime = cacheExpiry.get(key);
    if (expireTime && Date.now() > expireTime) {
      memoryCache.delete(key);
      cacheExpiry.delete(key);
      return null;
    }

    return memoryCache.get(key) || null;
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlSeconds - Time to live in seconds (default: 1 hour)
 * @returns {Promise<boolean>} - Success status
 */
async function set(key, value, ttlSeconds = 3600) {
  try {
    // Try Redis first
    if (redisClient && isConnected) {
      await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    }

    // Fallback to memory cache
    cleanMemoryCache();
    memoryCache.set(key, value);
    cacheExpiry.set(key, Date.now() + ttlSeconds * 1000);
    return true;
  } catch (error) {
    logger.error('Cache set error:', error);
    return false;
  }
}

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} - Success status
 */
async function del(key) {
  try {
    // Try Redis first
    if (redisClient && isConnected) {
      await redisClient.del(key);
      return true;
    }

    // Fallback to memory cache
    memoryCache.delete(key);
    cacheExpiry.delete(key);
    return true;
  } catch (error) {
    logger.error('Cache delete error:', error);
    return false;
  }
}

/**
 * Check if key exists in cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} - Existence status
 */
async function exists(key) {
  try {
    // Try Redis first
    if (redisClient && isConnected) {
      return (await redisClient.exists(key)) === 1;
    }

    // Fallback to memory cache
    cleanMemoryCache();
    const expireTime = cacheExpiry.get(key);
    if (expireTime && Date.now() > expireTime) {
      memoryCache.delete(key);
      cacheExpiry.delete(key);
      return false;
    }

    return memoryCache.has(key);
  } catch (error) {
    logger.error('Cache exists error:', error);
    return false;
  }
}

/**
 * Generate cache key for image processing
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} prompt - Processing prompt
 * @returns {string} - Cache key
 */
function generateImageCacheKey(imageBuffer, prompt) {
  const crypto = require('crypto');
  const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex');
  const promptHash = crypto.createHash('md5').update(prompt).digest('hex');
  return `img:${imageHash}:${promptHash}`;
}

/**
 * Generate cache key for API responses
 * @param {string} endpoint - API endpoint
 * @param {object} params - Request parameters
 * @returns {string} - Cache key
 */
function generateApiCacheKey(endpoint, params) {
  const crypto = require('crypto');
  const paramsHash = crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');
  return `api:${endpoint}:${paramsHash}`;
}

// Initialize Redis on module load
initializeRedis();

module.exports = {
  get,
  set,
  del,
  exists,
  generateImageCacheKey,
  generateApiCacheKey,
  isRedisConnected: () => isConnected,
  getStats: () => ({
    redis: isConnected,
    memoryCache: {
      size: memoryCache.size,
      maxSize: MAX_MEMORY_CACHE_SIZE,
    },
  }),
};
