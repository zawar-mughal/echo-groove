# Quick Start - Echo Upload Service

**Time to deploy**: ~30 minutes
**What you'll have**: Working Audius upload functionality on Fly.io

---

## What Was Built

✅ **Express.js Upload Service** (`/upload-service/`)
- Handles file uploads to Audius using @audius/sdk
- Production-ready with error handling and logging
- CORS configured for your frontend
- Health check endpoint for monitoring

✅ **Fly.io Deployment Config**
- Dockerfile for containerization
- fly.toml for Fly.io configuration
- Auto-scaling and health checks

✅ **Frontend Integration**
- Updated `useAudiusUpload.ts` to call upload service
- Environment variables configured
- Same FormData structure (no breaking changes)

✅ **Documentation**
- Deployment guide for Fly.io
- AWS migration roadmap for future scaling
- Complete troubleshooting guide

---

## Get Started in 3 Steps

### Step 1: Set Up Upload Service Locally (5 min)

```bash
# Navigate to upload service
cd upload-service

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add your Audius credentials
nano .env  # or use your favorite editor
```

Add to `.env`:
```
AUDIUS_API_KEY=your_key_here
AUDIUS_API_SECRET=your_secret_here
```

Start the service:
```bash
npm run dev
```

You should see:
```
🚀 Echo Upload Service running on port 3001
✓ Audius API credentials configured
```

### Step 2: Test Locally (5 min)

In a separate terminal, start the frontend:
```bash
# From project root
npm run dev
```

1. Open http://localhost:8080
2. Sign in with Audius OAuth
3. Navigate to a room
4. Try uploading a track
5. Watch the upload service terminal for logs

You should see logs like:
```
📤 Upload request received
🎵 Uploading to Audius...
✅ Upload successful! Track ID: abc123 (12.34s)
```

### Step 3: Deploy to Fly.io (20 min)

#### Install Fly CLI:
```bash
# macOS
brew install flyctl

# Linux/Windows - see https://fly.io/docs/hands-on/install-flyctl/
```

#### Deploy:
```bash
# Login to Fly.io
fly auth login

# Navigate to upload service
cd upload-service

# Launch app (follow prompts)
fly launch
# - Choose app name: echo-upload-service
# - Choose region: iad (US East)
# - Don't deploy yet

# Set secrets
fly secrets set AUDIUS_API_KEY=your_key_here
fly secrets set AUDIUS_API_SECRET=your_secret_here
fly secrets set ALLOWED_ORIGINS=http://localhost:8080,https://echo-beatbattle.vercel.app,https://echo-ed6i6s59n-33digital.vercel.app

# Deploy
fly deploy

# Test
curl https://echo-upload-service.fly.dev/health
```

#### Update Frontend:
Edit `.env`:
```
VITE_UPLOAD_SERVICE_URL=https://echo-upload-service.fly.dev
```

Restart frontend and test upload again!

---

## Verify Everything Works

### ✅ Upload Service Health Check
```bash
curl https://echo-upload-service.fly.dev/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-02T12:34:56.789Z",
  "service": "echo-upload-service",
  "version": "1.0.0"
}
```

### ✅ Frontend Can Reach Service
1. Open browser dev tools (F12)
2. Go to Console tab
3. Upload a track
4. You should see:
```
📤 Uploading to Audius via upload service: {...}
✅ Upload successful: abc123 (12.34s)
```

### ✅ Track Appears on Audius
1. Go to your Audius profile
2. Check "Tracks" tab
3. New upload should appear

---

## Common Issues & Fixes

### "Missing Audius API credentials"
**Fix**: Set secrets on Fly.io:
```bash
fly secrets set AUDIUS_API_KEY=your_key
fly secrets set AUDIUS_API_SECRET=your_secret
```

### CORS errors in browser
**Fix**: Add your frontend URL to allowed origins:
```bash
fly secrets set ALLOWED_ORIGINS=https://echo-beatbattle.vercel.app,https://echo-ed6i6s59n-33digital.vercel.app,http://localhost:8080
```

### Service not responding
**Fix**: Check logs and restart:
```bash
fly logs
fly apps restart echo-upload-service
```

### "Module not found" errors
**Fix**: Rebuild and deploy:
```bash
cd upload-service
npm install
fly deploy
```

---

## Architecture Overview

```
┌─────────────────┐
│   Frontend      │  React + Vite
│ (Vercel/Local)  │  (localhost:8080)
└────────┬────────┘
         │
         │ POST /upload
         │ (FormData)
         ▼
┌─────────────────┐
│  Upload Service │  Express.js
│   (Fly.io)      │  (localhost:3001 or Fly.io)
└────────┬────────┘
         │
         │ @audius/sdk
         ▼
┌─────────────────┐
│ Audius Protocol │  Decentralized music platform
│ (Content Nodes) │
└─────────────────┘
```

---

## Cost

**Current setup (Fly.io free tier)**:
- Upload service: $0/month (3 VMs, auto-scaling)
- Bandwidth: $0 for moderate usage
- **Total: $0/month** ✅

**When you exceed free tier** (~1K+ uploads/month):
- ~$5-10/month

---

## Next Steps

### Now
1. ✅ Deploy to Fly.io (follow Step 3 above)
2. Test with real uploads
3. Monitor Fly.io logs for any issues

### Before Launch
1. Deploy frontend to Vercel/Netlify
2. Update `ALLOWED_ORIGINS` to include `https://echo-beatbattle.vercel.app` and `https://echo-ed6i6s59n-33digital.vercel.app`
3. Add both domains (plus `http://localhost:8080`) to Supabase **Authentication → URL Configuration**
4. Test end-to-end on production
5. Set up monitoring/alerts

### When Scaling
1. Review `AWS_MIGRATION_ROADMAP.md`
2. Migrate to AWS + Flight Control
3. Build Everlink & TAP directly on AWS

---

## File Structure

```
upload-service/
├── index.js          # Express app with upload logic
├── package.json      # Dependencies (@audius/sdk, express, etc.)
├── Dockerfile        # Container configuration
├── fly.toml          # Fly.io deployment config
├── .env.example      # Environment variables template
├── .dockerignore     # Docker ignore patterns
└── README.md         # Detailed service documentation

src/
└── hooks/
    └── api/
        └── useAudiusUpload.ts  # Updated to call Fly.io

.env                  # Frontend environment variables (updated)
.env.example          # Template (updated)
```

---

## Commands Cheat Sheet

### Local Development
```bash
# Start upload service
cd upload-service && npm run dev

# Start frontend
npm run dev
```

### Fly.io
```bash
# Deploy
cd upload-service && fly deploy

# View logs
fly logs

# Check status
fly status

# Set secrets
fly secrets set KEY=value

# SSH into container
fly ssh console

# Restart
fly apps restart echo-upload-service
```

### Debugging
```bash
# Test health endpoint
curl http://localhost:3001/health
curl https://echo-upload-service.fly.dev/health

# View Fly.io logs
fly logs -a echo-upload-service

# Check secrets are set
fly secrets list
```

---

## Documentation

📖 **Detailed Guides**:
- `upload-service/README.md` - Service documentation
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `AWS_MIGRATION_ROADMAP.md` - Future AWS migration plan

🔧 **Troubleshooting**:
- Check service logs: `fly logs`
- Check browser console for errors (F12)
- Review CORS configuration
- Verify environment variables are set

💬 **Support**:
- Fly.io Docs: https://fly.io/docs
- Audius SDK: https://docs.audius.org/developers/sdk
- GitHub Issues: Create an issue in the repo

---

## Success Criteria

You're done when:
- ✅ Upload service deploys to Fly.io
- ✅ Health endpoint returns 200 OK
- ✅ Frontend can upload tracks successfully
- ✅ Tracks appear on Audius profile
- ✅ No CORS errors in browser console

---

**Ready to go!** Start with Step 1 above. ⬆️

Questions? Check `DEPLOYMENT_GUIDE.md` for more details.
