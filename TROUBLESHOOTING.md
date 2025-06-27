# ADGenerator2.0 Troubleshooting Guide

## Common Issues and Solutions

### 1. Server Issues

#### Port Already in Use (EADDRINUSE)
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
```

**Solution:**
- Kill existing process: `taskkill /f /im node.exe` (Windows) or `pkill node` (Mac/Linux)
- Or change port in `.env`: `PORT=3001`

### 2. Environment Configuration

#### Missing API Keys
```
Error: OpenAI API key not found
Error: Ideogram API key not found
```

**Solution:**
1. Copy `.env.example` to `.env`
2. Add your actual API keys:
```env
OPENAI_API_KEY=sk-your-openai-key
IDEOGRAM_API_KEY=your-ideogram-key
```

#### Redis Connection Issues
```
Redis connection error, falling back to in-memory cache
```

**Solution:**
- This is a warning, not an error. The app will use in-memory caching.
- To use Redis, install and configure Redis server, then update `.env`:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. File Upload Issues

#### File Size Too Large
```
File size too large. Maximum size is 5MB
```

**Solution:**
- Compress your image before uploading
- Or increase limit in `backend/config/constants.js`

#### Unsupported File Type
```
Only image files are allowed (image/png, image/jpeg, ...)
```

**Solution:**
- Use supported formats: PNG, JPG, JPEG, GIF, WEBP
- Check file extension matches content type

### 4. Performance Issues

#### Slow Image Processing
**Solutions:**
- Enable Redis caching for faster repeat requests
- Reduce number of generated prompts in constants.js
- Use smaller image files

#### High Memory Usage
**Solutions:**
- Enable image optimization (Sharp library)
- Clear cache periodically
- Limit concurrent requests

### 5. Development Issues

#### ESLint Warnings
```
ExpressSlowDownWarning: The behaviour of the 'delayMs' option was changed
```

**Solution:**
Already fixed in latest version. Run `npm run lint:fix` to auto-fix.

#### Test Failures
**Common causes:**
- API keys not set in test environment
- Ports conflicts during testing
- Race conditions in async tests

**Solution:**
```bash
npm run clean
npm test
```

### 6. Production Deployment

#### Build Failures
```
Error: Module not found
```

**Solution:**
```bash
npm run clean
npm install
npm run build
```

#### CORS Issues
```
Access to fetch blocked by CORS policy
```

**Solution:**
Update CORS origins in `.env`:
```env
CORS_ORIGINS=https://yourapp.com,https://www.yourapp.com
```

### 7. API Rate Limiting

#### Too Many Requests
```
Too many API requests from this IP
```

**Solution:**
- Wait for the rate limit window to reset (15 minutes)
- Or increase limits in `backend/config/constants.js`

### 8. Monitoring and Logs

#### Check Application Health
```bash
curl http://localhost:3000/health
```

#### View Logs
- Application logs: `backend/logs/app.log`
- Error logs: `backend/logs/error.log`
- Combined logs: `backend/logs/combined.log`

#### Enable Debug Mode
Set in `.env`:
```env
NODE_ENV=development
DEBUG=true
```

### 9. Cache Issues

#### Clear Cache
```bash
npm run clean
```

#### Cache Not Working
- Check Redis connection
- Verify cache TTL settings
- Monitor cache hit/miss rates via `/health` endpoint

### 10. Image Generation Issues

#### OpenAI API Errors
- Check API key validity
- Verify account has sufficient credits
- Check rate limits on OpenAI dashboard

#### Ideogram API Errors
- Verify API key is active
- Check prompt content for policy violations
- Monitor generation quotas

## Getting Help

1. **Check Logs:** Always check the application logs first
2. **Health Check:** Visit `/health` endpoint to see service status
3. **Environment:** Verify all required environment variables are set
4. **Dependencies:** Run `npm audit` to check for security issues

## Useful Commands

```bash
# Full application restart
npm run clean && npm install && npm start

# Run with debugging
NODE_ENV=development npm start

# Check all services
npm run health-check

# Run tests with verbose output
npm test -- --verbose

# Format and lint code
npm run format && npm run lint:fix
``` 