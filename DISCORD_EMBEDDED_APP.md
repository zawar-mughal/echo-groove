# Discord Embedded App Integration

This document describes the Discord embedded app implementation for Echo Groove Battle.

## Overview

The app now supports running as an embedded application within Discord. When detected in a Discord environment, all external API calls are automatically routed through Discord's proxy system to comply with Discord's Content Security Policy (CSP).

## Architecture

### Key Components

1. **Discord Proxy Utilities** (`src/utils/discord-proxy.ts`)
   - `isInDiscordApp()`: Detects if the app is running in Discord
   - `getDiscordProxiedUrl()`: Converts URLs to Discord-compatible proxy format
   - `getProxiedAssetUrl()`: Proxies static assets
   - `getDiscordProxiedUrlSession()`: Proxies session endpoints

2. **Discord SDK Setup** (`src/components/DiscordEmbeddedApp.tsx`)
   - Initializes the Discord Embedded App SDK
   - Configures URL mapping for Supabase and Audius APIs
   - Uses `patchUrlMappings` to intercept API calls

3. **Proxy Handler**
   - **Development**: Vite middleware (`src/vite-plugins/discord-proxy.ts`)
   - **Production**: Vercel serverless function (`api/proxy.ts`)
   - Both handle the `/.proxy/api/proxy` route and forward requests

4. **App Integration** (`src/App.tsx`)
   - Detects Discord environment on startup
   - Initializes Discord SDK before rendering
   - Shows loading state during initialization

## How It Works

### Flow Diagram

```
Discord Client
    ↓
Loads app in iframe: your-app.vercel.app
    ↓
App detects Discord (window.location.hostname includes 'discord')
    ↓
setupDiscordProxy() called
    ↓
patchUrlMappings registers:
  - /supabase-api → your-project.supabase.co
  - /audius-api → discoveryprovider.audius.co
  - /api → your-app.vercel.app/api
    ↓
All fetch() calls intercepted by Discord SDK
    ↓
Rewritten to: /.proxy/api/proxy?url=<target>&originalParams=<params>
    ↓
Proxy handler forwards to actual target
    ↓
Response returned to app
```

### Example Request Flow

1. App makes request: `fetch('https://your-project.supabase.co/rest/v1/rooms')`
2. Discord SDK intercepts and rewrites to: `/.proxy/api/proxy?url=https://your-project.supabase.co/rest/v1/rooms`
3. Proxy handler fetches from Supabase
4. Response returned with proper CORS headers
5. App receives data

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Required for Discord embedded app
VITE_DISCORD_CLIENT_ID=your-discord-client-id

# These should already exist
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_AUDIUS_API_URL=https://discoveryprovider.audius.co
VITE_SITE_URL=https://your-app.vercel.app
```

### Discord Developer Portal Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application (or use existing)
3. Navigate to "Activities" section
4. Add your app URL mapping:
   - Development: `http://localhost:8080`
   - Production: `https://your-app.vercel.app`
5. Copy the Client ID to `VITE_DISCORD_CLIENT_ID`

## Modified Files

### New Files
- `src/utils/discord-proxy.ts` - Proxy utility functions
- `src/components/DiscordEmbeddedApp.tsx` - Discord SDK initialization
- `src/vite-plugins/discord-proxy.ts` - Development proxy middleware
- `api/proxy.ts` - Production proxy serverless function

### Modified Files
- `src/App.tsx` - Added Discord initialization on startup
- `src/lib/supabase.ts` - Updated to use proxied URLs in Discord
- `src/hooks/api/useAudiusUpload.ts` - Updated upload service calls
- `vite.config.ts` - Added Discord proxy plugin
- `vercel.json` - Added proxy route rewrite
- `.env.example` - Added Discord client ID

## Testing

### Local Testing
1. Set `VITE_DISCORD_CLIENT_ID` in your `.env` file
2. Run `npm run dev`
3. The app will work normally in browser (proxy not active)
4. To test Discord mode, temporarily modify `isInDiscordApp()` to return `true`

### Discord Testing
1. Deploy to Vercel (or your hosting platform)
2. Configure the URL in Discord Developer Portal
3. Create a test server and install your app
4. Launch the app from Discord

## API Proxying Details

### Supported Features
- All HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Request/response cookies preserved
- JSON, binary, and image content types
- Query parameter forwarding
- Pre-signed URLs (with `decodeParams` flag)

### Proxy URL Format
```
/.proxy/api/proxy?url=<encoded-target-url>&originalParams=<encoded-params>&decodeParams=<true|false>
```

## Limitations

1. **No Discord Authentication Yet**: Auth flow not implemented (planned for later)
2. **No Discord Bot**: Bot integration planned for future (slash commands, etc.)
3. **Real-time Features**: Supabase realtime disabled (not compatible with Discord CSP)
4. **WebSockets**: Not currently proxied (would need separate implementation)

## Future Enhancements

- [ ] Discord OAuth authentication flow
- [ ] Discord bot with slash commands
- [ ] Discord presence integration
- [ ] Discord rich embeds for sharing tracks
- [ ] Voice channel integration for audio playback

## Troubleshooting

### App doesn't load in Discord
- Check that `VITE_DISCORD_CLIENT_ID` is set correctly
- Verify URL mapping in Discord Developer Portal
- Check browser console for errors

### API calls fail
- Verify proxy route is working: `curl https://your-app.vercel.app/.proxy/api/proxy?url=https://example.com`
- Check that all API URLs are being proxied (add console logs in `getDiscordProxiedUrl`)
- Ensure Vercel serverless function is deployed

### Build errors
- Make sure `@discord/embedded-app-sdk` is installed
- Check that TypeScript can resolve types
- Verify Vite plugin is properly loaded

## Resources

- [Discord Embedded App SDK Docs](https://discord.com/developers/docs/activities/overview)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
