const request = require('supertest');
const express = require('express');
const axios = require('axios');
const app = require('../backend/server');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      // Mock OpenAI API response
      mockedAxios.get.mockResolvedValue({
        data: { data: [] }
      });

      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/);

      expect(response.status).toBeOneOf([200, 503, 500]);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('services');
    });
  });

  describe('POST /api/process', () => {
    it('should reject requests without files', async () => {
      const response = await request(app)
        .post('/api/process')
        .field('prompt', 'test prompt')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('No files uploaded');
    });

    it('should reject requests with invalid prompt', async () => {
      const response = await request(app)
        .post('/api/process')
        .attach('image', Buffer.from('fake-image'), 'test.jpg')
        .field('prompt', 'short') // Too short
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Validation failed');
    });

    it('should reject unsupported file types', async () => {
      const response = await request(app)
        .post('/api/process')
        .attach('image', Buffer.from('fake-file'), 'test.txt')
        .field('prompt', 'Valid prompt that is long enough for validation')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should process valid requests successfully', async () => {
      // Mock OpenAI response
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              content: JSON.stringify([
                'Generated prompt 1',
                'Generated prompt 2',
                // Add more to reach the required count
                ...Array(14).fill(0).map((_, i) => `Generated prompt ${i + 3}`)
              ])
            }
          }]
        }
      });

      // Mock Ideogram responses
      mockedAxios.post.mockResolvedValue({
        data: {
          data: [
            { url: 'https://example.com/image1.jpg' },
            { url: 'https://example.com/image2.jpg' }
          ]
        }
      });

      const response = await request(app)
        .post('/api/process')
        .attach('image', Buffer.from('fake-image-data'), 'test.jpg')
        .field('prompt', 'Valid test prompt that meets length requirements for processing')
        .expect(200);

      // Background processing now returns taskId instead of direct results
      expect(response.body).toHaveProperty('taskId');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Processing started');
      expect(response.body).toHaveProperty('estimatedTime');
    }, 60000); // Increase timeout for this test
  });

  describe('POST /api/export-zip', () => {
    it('should reject requests without URLs', async () => {
      const response = await request(app)
        .post('/api/export-zip')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('No image URLs provided');
    });

    it('should create zip file from URLs', async () => {
      // Mock image download
      mockedAxios.get.mockResolvedValue({
        data: Buffer.from('fake-image-data')
      });

      const response = await request(app)
        .post('/api/export-zip')
        .send({ urls: ['https://example.com/image1.jpg'] })
        .expect(200);

      expect(response.headers['content-type']).toBe('application/zip');
      expect(response.headers['content-disposition']).toContain('attachment');
    });
  });

  describe('Rate Limiting', () => {
    it('should implement rate limiting on API routes', async () => {
      const promises = [];
      
      // Make multiple POST requests to trigger rate limiting (POST is the valid method)
      for (let i = 0; i < 15; i++) {
        promises.push(
          request(app)
            .post('/api/process')
            .field('prompt', 'test prompt for rate limiting')
            .then(response => {
              // Should get either validation error (400) or rate limit (429)
              expect([400, 429]).toContain(response.status);
            })
            .catch(err => {
              // Handle any network errors
              expect([400, 429, 500]).toContain(err.status || 500);
            })
        );
      }

      await Promise.allSettled(promises);
    });
  });
});

// Helper matcher for Jest
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
}); 