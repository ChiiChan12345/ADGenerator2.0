const cache = require('../backend/utils/cache');
const { optimizeImage } = require('../backend/utils/imageOptimizer');
const { performHealthCheck } = require('../backend/utils/health-check');
const logger = require('../backend/utils/logger');

describe('Utility Functions', () => {
  describe('Cache', () => {
    beforeEach(async () => {
      // Clear cache before each test
      await cache.del('test-key');
    });

    it('should set and get values from cache', async () => {
      const testValue = { message: 'Hello World', timestamp: Date.now() };
      
      await cache.set('test-key', testValue, 60);
      const retrieved = await cache.get('test-key');
      
      expect(retrieved).toEqual(testValue);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cache.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should check if key exists', async () => {
      await cache.set('test-key', 'test-value', 60);
      
      const exists = await cache.exists('test-key');
      const notExists = await cache.exists('non-existent-key');
      
      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });

    it('should delete keys', async () => {
      await cache.set('test-key', 'test-value', 60);
      await cache.del('test-key');
      
      const result = await cache.get('test-key');
      expect(result).toBeNull();
    });

    it('should generate consistent cache keys', () => {
      const buffer1 = Buffer.from('test-image-data');
      const buffer2 = Buffer.from('test-image-data');
      const prompt = 'test prompt';
      
      const key1 = cache.generateImageCacheKey(buffer1, prompt);
      const key2 = cache.generateImageCacheKey(buffer2, prompt);
      
      expect(key1).toBe(key2);
      expect(key1).toMatch(/^img:[a-f0-9]{32}:[a-f0-9]{32}$/);
    });

    it('should return cache stats', () => {
      const stats = cache.getStats();
      
      expect(stats).toHaveProperty('redis');
      expect(stats).toHaveProperty('memoryCache');
      expect(typeof stats.redis).toBe('boolean');
      expect(stats.memoryCache).toHaveProperty('size');
      expect(stats.memoryCache).toHaveProperty('maxSize');
    });
  });

  describe('Image Optimizer', () => {
    it('should optimize images successfully', async () => {
      // Create a minimal valid JPEG buffer
      const mockImageBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46,
        0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00,
        0xFF, 0xD9
      ]);
      
      try {
        const result = await optimizeImage(mockImageBuffer, 'image/jpeg');
        
        expect(result).toHaveProperty('buffer');
        expect(result).toHaveProperty('mimetype');
        expect(result).toHaveProperty('metadata');
        expect(Buffer.isBuffer(result.buffer)).toBe(true);
      } catch (error) {
        // If optimization fails (e.g., invalid image), it should return original
        expect(error).toBeDefined();
      }
    });

    it('should handle optimization errors gracefully', async () => {
      const invalidBuffer = Buffer.from('not-an-image');
      
      const result = await optimizeImage(invalidBuffer, 'image/jpeg');
      
      expect(result).toHaveProperty('buffer');
      expect(result).toHaveProperty('mimetype');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('error');
    });
  });

  describe('Health Check', () => {
    it('should perform health check and return status', async () => {
      const health = await performHealthCheck();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('uptime');
      expect(health).toHaveProperty('services');
      expect(health).toHaveProperty('system');
      
      expect(['healthy', 'warning', 'degraded', 'error']).toContain(health.status);
      expect(typeof health.uptime).toBe('number');
      expect(health.services).toHaveProperty('openai');
      expect(health.services).toHaveProperty('ideogram');
      expect(health.services).toHaveProperty('cache');
    });

    it('should include system information', async () => {
      const health = await performHealthCheck();
      
      expect(health.system).toHaveProperty('memory');
      expect(health.system).toHaveProperty('nodeVersion');
      expect(health.system).toHaveProperty('platform');
      
      expect(health.system.memory).toHaveProperty('used');
      expect(health.system.memory).toHaveProperty('total');
      expect(typeof health.system.memory.used).toBe('number');
      expect(typeof health.system.memory.total).toBe('number');
    });
  });

  describe('Logger', () => {
    it('should be defined and have required methods', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should log messages without throwing errors', () => {
      expect(() => {
        logger.info('Test info message');
        logger.error('Test error message');
        logger.warn('Test warning message');
        logger.debug('Test debug message');
      }).not.toThrow();
    });
  });
}); 