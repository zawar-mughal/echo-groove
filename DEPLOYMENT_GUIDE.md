# Echo Groove Battle - Deployment Guide

Complete guide for deploying Echo to production (current: Fly.io + Supabase, future: AWS).

---

## Current Architecture (Phase 1)

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  React + Vite (Vercel/Netlify)                  │
└────────────┬────────────────────────────────────┘
             │
             ├─────────────┐
             │             │
             ▼             ▼
    ┌────────────┐   ┌─────────────────┐
    │  Supabase  │   │   Fly.io        │
    │  Database  │   │  Upload Service │
    │  Auth      │   │  (@audius/sdk)  │
    │  Storage   │   │                 │
    └────────────┘   └────────┬────────┘
                              │
                              ▼
                       ┌─────────────┐
                       │   Audius    │
                       │   Protocol  │
                       └─────────────┘
```

---

## Prerequisites

### Required Accounts
- [Supabase](https://supabase.com/) - Database, Auth, Storage
- [Fly.io](https://fly.io/) - Upload service hosting
- [Vercel](https://vercel.com/) or [Netlify](https://netlify.com/) - Frontend hosting
- [Audius](https://dashboard.audius.org/) - Music platform API

### Required Tools
- Node.js 18+
- npm or yarn
- Fly CLI (`brew install flyctl` or https://fly.io/docs/hands-on/install-flyctl/)
- Git

### Required Credentials
- Supabase project URL and anon key
- Audius API key and secret
- GitHub account (for CI/CD)

---

## Step-by-Step Deployment

### 1. Deploy Upload Service to Fly.io

#### A. Install Fly CLI
```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

#### B. Login to Fly.io
```bash
fly auth login
```

#### C. Deploy the Upload Service
```bash
# Navigate to upload service directory
cd upload-service

# Launch app (first time only)
fly launch

# Follow prompts:
# - App name: echo-upload-service (or custom)
# - Region: iad (US East) or closest to your users
# - Don't deploy yet (we need to set secrets first)
```

#### D. Set Environment Secrets
```bash
# Set Audius credentials
fly secrets set AUDIUS_API_KEY=your_audius_api_key_here
fly secrets set AUDIUS_API_SECRET=your_audius_api_secret_here

# Set allowed origins (update with your frontend URL)
fly secrets set ALLOWED_ORIGINS=https://echo-beatbattle.vercel.app,https://echo-ed6i6s59n-33digital.vercel.app,http://localhost:8080
```

#### E. Deploy
```bash
fly deploy
```

#### F. Verify Deployment
```bash
# Check status
fly status

# View logs
fly logs

# Test health endpoint
curl https://echo-upload-service.fly.dev/health
```

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-02T12:34:56.789Z",
  "service": "echo-upload-service",
  "version": "1.0.0"
}
```

---

### 2. Configure Supabase

Your Supabase project should already be set up. Verify:

#### A. Database Tables
Ensure all tables exist:
- `rooms`
- `submissions`
- `profiles`
- `votes` (if used)

#### B. Row Level Security (RLS)
Enable RLS on sensitive tables and create appropriate policies.

#### C. Storage Buckets
Create buckets for:
- User avatars
- Room cover images
- Any other media

#### D. Auth Redirect URLs
In Supabase Dashboard, go to **Authentication → URL Configuration** and make sure these URLs are present (in addition to your local dev host):
- `https://echo-beatbattle.vercel.app`
- `https://echo-ed6i6s59n-33digital.vercel.app`
- `http://localhost:8080`

---

### 3. Deploy Frontend to Vercel

#### A. Connect GitHub Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the root directory

#### B. Configure Build Settings
```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

> ℹ️ The repository includes a `vercel.json` that sets these defaults and adds an SPA rewrite so React Router routes resolve correctly.

#### C. Set Environment Variables
Add these in Vercel project settings:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Frontend Site URL (used for Supabase magic links)
VITE_SITE_URL=https://echo-beatbattle.vercel.app

# Audius
VITE_AUDIUS_API_KEY=your_audius_api_key
VITE_AUDIUS_API_URL=https://discoveryprovider.audius.co

# Upload Service
VITE_UPLOAD_SERVICE_URL=https://echo-upload-service.fly.dev
```

#### D. Deploy
Click "Deploy" - Vercel will build and deploy automatically.

#### E. Update CORS
After getting your Vercel URLs (production + preview), update Fly.io secrets:
```bash
fly secrets set ALLOWED_ORIGINS=https://echo-beatbattle.vercel.app,https://echo-ed6i6s59n-33digital.vercel.app,http://localhost:8080
```

---

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/echo-groove-battle.git
cd echo-groove-battle
```

### 2. Install Dependencies
```bash
# Frontend
npm install

# Upload service
cd upload-service
npm install
cd ..
```

### 3. Configure Environment Variables

#### Frontend `.env`:
```bash
cp .env.example .env
# Edit .env with your credentials
```

#### Upload Service `.env`:
```bash
cd upload-service
cp .env.example .env
# Edit .env with your Audius credentials
```

### 4. Start Development Servers

#### Terminal 1 - Frontend:
```bash
npm run dev
# Runs on http://localhost:8080
```

#### Terminal 2 - Upload Service:
```bash
cd upload-service
npm run dev
# Runs on http://localhost:3001
```

### 5. Test Locally
1. Open http://localhost:8080 in your browser
2. Sign in with Audius OAuth
3. Navigate to a room
4. Try uploading a track
5. Check upload service logs in Terminal 2

---

## CI/CD Setup (GitHub Actions)

### Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy-upload-service:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Fly.io
        uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy to Fly.io
        run: |
          cd upload-service
          flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Vercel automatically deploys on push to main
      # No additional steps needed if connected via Vercel dashboard
```

### Add GitHub Secrets
1. Go to GitHub repo → Settings → Secrets → Actions
2. Add `FLY_API_TOKEN`:
   ```bash
   fly tokens create deploy -x 999999h
   ```

---

## Monitoring & Maintenance

### Fly.io Monitoring
```bash
# View real-time logs
fly logs -a echo-upload-service

# Check resource usage
fly status -a echo-upload-service

# SSH into container (debugging)
fly ssh console -a echo-upload-service

# Scale instances
fly scale count 2 -a echo-upload-service

# Check costs
fly dashboard
```

### Supabase Monitoring
1. Go to Supabase Dashboard
2. Check "Database" → "Performance"
3. Monitor "Auth" → "Users"
4. Review "Storage" → "Usage"
5. Check "Logs" for errors

### Vercel Monitoring
1. Go to Vercel Dashboard
2. Check "Deployments" for build status
3. Review "Analytics" for traffic
4. Monitor "Logs" for errors

---

## Troubleshooting

### Upload Service Not Responding
```bash
# Check if service is running
fly status

# View logs
fly logs

# Restart service
fly apps restart echo-upload-service

# Check secrets are set
fly secrets list
```

### CORS Errors from Frontend
**Problem**: Browser blocks requests due to CORS.

**Solution**:
```bash
# Update ALLOWED_ORIGINS on Fly.io
fly secrets set ALLOWED_ORIGINS=https://echo-beatbattle.vercel.app,https://echo-ed6i6s59n-33digital.vercel.app,http://localhost:8080

# Redeploy
cd upload-service
fly deploy
```

### "Missing Audius API credentials"
**Problem**: Upload service can't access Audius credentials.

**Solution**:
```bash
# Set secrets on Fly.io
fly secrets set AUDIUS_API_KEY=your_key
fly secrets set AUDIUS_API_SECRET=your_secret

# Verify
fly secrets list
```

### Upload Times Out
**Problem**: Large files take too long to upload.

**Solution**:
- Check file size (max 100 MB)
- Ensure stable internet connection
- Check Audius platform status
- Review Fly.io logs for errors

### Supabase Connection Errors
**Problem**: Frontend can't connect to Supabase.

**Solution**:
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check Supabase project is active
- Review RLS policies aren't blocking access
- Check network connectivity

---

## Cost Breakdown

### Current Stack (Phase 1)
| Service | Tier | Cost/Month |
|---------|------|------------|
| Fly.io | Free (3 VMs) | $0 |
| Supabase | Pro | $25 |
| Vercel | Free/Pro | $0-20 |
| **Total** | | **$25-45** |

### Production Estimates (with traffic)
| Service | Est. Cost |
|---------|-----------|
| Fly.io | $0-10 |
| Supabase | $25-100 |
| Vercel | $20-50 |
| **Total** | **$45-160** |

---

## Scaling Considerations

### When to Scale Fly.io
- If response times > 2 seconds consistently
- If you hit free tier limits
- If you need multi-region deployment

```bash
# Scale to 2 instances
fly scale count 2

# Upgrade machine size
fly scale vm shared-cpu-2x

# Add region
fly regions add lhr  # London
```

### When to Upgrade Supabase
- Database size > 8 GB
- Need more concurrent connections
- Need better performance
- Free tier rate limits hit

**Upgrade**: Supabase Pro ($25) → Team ($599) → Enterprise (custom)

### When to Migrate to AWS
- See `AWS_MIGRATION_ROADMAP.md`
- Typically when:
  - Building project #2 or #3
  - Monthly costs > $300
  - Need advanced AWS features

---

## Security Checklist

- [ ] All environment variables set correctly
- [ ] Supabase RLS policies enabled
- [ ] API keys kept secret (never commit to Git)
- [ ] CORS configured properly (not "*" in production)
- [ ] HTTPS enabled (automatic on Fly.io/Vercel)
- [ ] Supabase Auth configured with secure policies
- [ ] File upload size limits enforced
- [ ] Rate limiting enabled (if needed)
- [ ] Monitoring and alerts set up
- [ ] Backup strategy in place

---

## Backup & Recovery

### Database Backups
Supabase automatically backs up daily. To manually backup:
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Backup database
supabase db dump -f backup.sql
```

### Restore Database
```bash
supabase db push --dry-run
supabase db push
```

### Upload Service Backups
Code is in Git. Redeploy if needed:
```bash
cd upload-service
fly deploy
```

---

## Next Steps

1. **Current Phase**: Complete Echo prototype on Fly.io
2. **Validate**: Get user feedback, iterate on features
3. **When ready**: Migrate to AWS using `AWS_MIGRATION_ROADMAP.md`

---

## Support Resources

### Documentation
- **Fly.io**: https://fly.io/docs
- **Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com/docs
- **Audius SDK**: https://docs.audius.org/developers/sdk

### Community
- Fly.io Community: https://community.fly.io/
- Supabase Discord: https://discord.supabase.com/
- Vercel Discussions: https://github.com/vercel/vercel/discussions

### Issues
- GitHub Issues: https://github.com/yourusername/echo-groove-battle/issues

---

**Last Updated**: January 2025
