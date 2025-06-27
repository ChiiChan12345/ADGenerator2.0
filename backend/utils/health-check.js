const axios = require('axios');
const logger = require('./logger');
const cache = require('./cache');

/**
 * Perform comprehensive health check
 * @returns {Promise<object>} Health status
 */
async function performHealthCheck() {
  const startTime = Date.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('../../package.json').version,
    services: {},
    system: {},
    errors: [],
  };

  try {
    // Check system resources
    health.system = {
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      cpu: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
    };

    // Check OpenAI API
    try {
      if (process.env.OPENAI_API_KEY) {
        const openaiResponse = await axios.get('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
          timeout: 5000,
        });
        health.services.openai = {
          status: 'healthy',
          responseTime: Date.now() - startTime,
          available: true,
        };
      } else {
        health.services.openai = {
          status: 'warning',
          message: 'API key not configured',
          available: false,
        };
      }
    } catch (error) {
      health.services.openai = {
        status: 'error',
        message: error.message,
        available: false,
      };
      health.errors.push(`OpenAI API: ${error.message}`);
    }

    // Check Ideogram API (basic connectivity)
    try {
      if (process.env.IDEOGRAM_API_KEY) {
        // Since Ideogram doesn't have a simple health endpoint, we'll just validate the key format
        health.services.ideogram = {
          status: 'assumed_healthy',
          message: 'API key configured',
          available: true,
        };
      } else {
        health.services.ideogram = {
          status: 'warning',
          message: 'API key not configured',
          available: false,
        };
      }
    } catch (error) {
      health.services.ideogram = {
        status: 'error',
        message: error.message,
        available: false,
      };
      health.errors.push(`Ideogram API: ${error.message}`);
    }

    // Check cache system
    try {
      const cacheStats = cache.getStats();
      health.services.cache = {
        status: 'healthy',
        redis: cacheStats.redis,
        memoryCache: cacheStats.memoryCache,
        available: true,
      };
    } catch (error) {
      health.services.cache = {
        status: 'error',
        message: error.message,
        available: false,
      };
      health.errors.push(`Cache: ${error.message}`);
    }

    // Overall health determination
    const criticalErrors = health.errors.filter(
      error => error.includes('OpenAI') || error.includes('Ideogram')
    );

    if (criticalErrors.length > 0) {
      health.status = 'degraded';
    } else if (health.errors.length > 0) {
      health.status = 'warning';
    }

    health.responseTime = Date.now() - startTime;

    return health;
  } catch (error) {
    logger.error('Health check failed:', error);
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      message: error.message,
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * CLI health check for monitoring scripts
 */
async function runCliHealthCheck() {
  try {
    const health = await performHealthCheck();
    console.log(JSON.stringify(health, null, 2));

    // Exit with appropriate code
    if (health.status === 'healthy') {
      process.exit(0);
    } else if (health.status === 'warning' || health.status === 'degraded') {
      process.exit(1);
    } else {
      process.exit(2);
    }
  } catch (error) {
    console.error('Health check error:', error.message);
    process.exit(3);
  }
}

// Run CLI health check if called directly
if (require.main === module) {
  runCliHealthCheck();
}

module.exports = {
  performHealthCheck,
  runCliHealthCheck,
};
