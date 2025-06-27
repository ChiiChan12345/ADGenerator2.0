// Test setup and global configurations
require('dotenv').config({ path: '.env.test' });

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.IDEOGRAM_API_KEY = 'test-ideogram-key';
process.env.PORT = '3001';

// Global test timeout
jest.setTimeout(30000);

// Mock external APIs by default
jest.mock('axios');

// Console spy to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to disable console.log in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup global test data
global.testData = {
  mockImageBuffer: Buffer.from('mock-image-data'),
  mockPrompt: 'Test prompt for image generation',
  mockImageUrls: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg'
  ],
  mockPrompts: [
    'Generated prompt 1',
    'Generated prompt 2'
  ]
}; 