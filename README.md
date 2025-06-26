# ADGenerator2.0: Internal Image Generation App

A simple, secure, full-stack web app for internal use. Upload an image and a prompt, get OpenAI-powered text, and generate new images with Ideogram's API.

---

## Features
- Upload an image (PNG, JPG, JPEG, GIF, WEBP; max 5MB)
- Enter a short text prompt
- Uses OpenAI ChatGPT API to process your prompt and image
- Uses Ideogram Generate-V3 API to create new images
- Displays generated images on the same page
- All API keys are securely loaded from environment variables
- User-friendly error handling

---

## Setup

### 1. Clone the repository
```bash
git clone <this-repo-url>
cd ADGenerator2.0
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create a `.env` file in the root directory
```
OPENAI_API_KEY=your-openai-api-key
IDEOGRAM_API_KEY=your-ideogram-api-key
PORT=3000 # or any port you prefer
```

### 4. Run the app
```bash
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
backend/         # Express server, API routes, controllers
frontend/        # Static React app (served by backend)
.env             # Environment variables (not committed)
README.md        # This file
```

---

## Security & Best Practices
- Only common image types are accepted
- File size is limited to 5MB
- All user inputs are sanitized
- API errors are handled gracefully

---

## Notes
- For internal use only. Do not expose API keys publicly.
- You need valid OpenAI and Ideogram API keys.
- If you have issues, check your `.env` and server logs. 