# ADGenerator2.0 Deployment Guide

## Prerequisites
- Node.js 16+ 
- npm 8+
- OpenAI API Key
- Ideogram API Key

## Environment Variables Required

Create a `.env` file in the project root:

```env
# Required API Keys
OPENAI_API_KEY=your-openai-api-key-here
IDEOGRAM_API_KEY=your-ideogram-api-key-here

# Server Configuration
PORT=3000
NODE_ENV=production

# Optional: Redis for caching (recommended for production)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

## Platform-Specific Deployment

### Railway

1. **Connect Repository**: Link your GitHub repository to Railway
2. **Set Environment Variables**: Add required env vars in Railway dashboard
3. **Configure Build**: Railway auto-detects Node.js, no additional config needed
4. **Deploy**: Push to main branch to trigger deployment

**Railway-specific notes:**
- Buildpacks automatically detect Node.js
- `npm ci` and `npm run build` run automatically
- Sharp (image optimization) is optional and will gracefully fall back if unavailable

### Heroku

1. **Create Heroku App**:
```bash
heroku create your-app-name
```

2. **Set Environment Variables**:
```bash
heroku config:set OPENAI_API_KEY=your-key
heroku config:set IDEOGRAM_API_KEY=your-key
heroku config:set NODE_ENV=production
```

3. **Deploy**:
```bash
git push heroku main
```

### Vercel

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
vercel --prod
```

3. **Set Environment Variables** in Vercel dashboard

### Docker

1. **Build Image**:
```bash
docker build -t adgenerator2.0 .
```

2. **Run Container**:
```bash
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=your-key \
  -e IDEOGRAM_API_KEY=your-key \
  -e NODE_ENV=production \
  adgenerator2.0
```

### DigitalOcean App Platform

1. **Create App** from GitHub repository
2. **Configure Environment Variables** in dashboard
3. **Deploy** automatically from main branch

## Production Optimizations

### Performance
- Redis caching is highly recommended for production
- Set `NODE_ENV=production` for optimized builds
- Consider using CDN for static assets

### Security
- Use HTTPS in production
- Set proper CORS origins
- Monitor API rate limits
- Regularly rotate API keys

### Monitoring
- Check `/health` endpoint for service status
- Monitor logs in `backend/logs/` directory
- Set up alerts for error rates

## Scaling Considerations

### Horizontal Scaling
- Use Redis for session storage across instances
- Configure load balancer sticky sessions if needed
- Ensure all instances share the same Redis instance

### Vertical Scaling
- Monitor memory usage during image processing
- Consider increasing instance size for high-volume usage
- Background processing handles concurrent requests well

## Troubleshooting Deployment

### Common Issues

1. **Sharp Build Failures**:
   - Sharp is now optional, app will work without it
   - Image optimization will be disabled but functionality preserved

2. **Memory Issues**:
   - Increase instance memory allocation
   - Monitor background job processing

3. **API Rate Limits**:
   - Check OpenAI/Ideogram API quotas
   - Implement request queuing if needed

4. **Build Timeouts**:
   - Use `.dockerignore` to reduce build context
   - Consider multi-stage Docker builds for large projects

### Health Checks

Monitor these endpoints:
- `GET /health` - Overall system health
- Check logs for error patterns
- Monitor API response times

## Environment-Specific Notes

### Development
```bash
npm run dev
```

### Staging
```bash
NODE_ENV=staging npm start
```

### Production
```bash
NODE_ENV=production npm start
```

## Post-Deployment Verification

1. **Health Check**: Visit `/health` endpoint
2. **Functionality Test**: Upload test image with prompt
3. **Performance Test**: Monitor response times
4. **Log Monitoring**: Check for any error patterns

## Backup and Recovery

### Data to Backup
- Environment configuration
- API keys (securely stored)
- Application logs (if needed for debugging)

### Recovery Process
1. Redeploy from Git repository
2. Restore environment variables
3. Verify health endpoints
4. Test core functionality

The application is designed to be stateless, making recovery straightforward. 