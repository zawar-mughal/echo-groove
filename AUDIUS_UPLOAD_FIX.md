# Audius Upload Fix - Setup Guide

## Problem Summary

Audius track uploads were failing because the Audius SDK requires an **API SECRET** for all write operations (uploads, updates, deletes). API secrets cannot be safely exposed in frontend code.

## Solution

We've implemented a **Supabase Edge Function** that acts as a secure proxy between the frontend and Audius API. The Edge Function safely stores the API secret server-side and handles uploads on behalf of authenticated users.

---

## Setup Steps

### 1. Get Your Audius API Secret

1. Go to the [Audius Developer Dashboard](https://dashboard.audius.org/)
2. Log in with your Audius account
3. Navigate to your app settings
4. Copy your **API Secret** (keep this safe!)

### 2. Configure Supabase Secrets

You need to add the Audius API credentials to your Supabase project as secrets.

#### Option A: Via Supabase CLI (Recommended)

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Set the secrets
supabase secrets set AUDIUS_API_KEY=81d8afd97d5e1e6f55b15b86dc0ffc6e291d60df
supabase secrets set AUDIUS_API_SECRET=your_api_secret_here
```

#### Option B: Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions**
3. Click on **Manage secrets**
4. Add two secrets:
   - `AUDIUS_API_KEY`: `81d8afd97d5e1e6f55b15b86dc0ffc6e291d60df`
   - `AUDIUS_API_SECRET`: `your_api_secret_here` (from step 1)

### 3. Deploy the Edge Function

The Edge Function code is already created in `supabase/functions/audius-upload/index.ts`.

#### Deploy via Supabase CLI:

```bash
# Deploy the function
supabase functions deploy audius-upload

# Verify deployment
supabase functions list
```

You should see `audius-upload` in the list of deployed functions.

### 4. Test the Upload

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to a room and click "Upload" or submit a track

3. Try uploading an MP3 file with cover art

4. Check the browser console for logs:
   - `📤 Uploading to Audius via Supabase Edge Function`
   - `✅ Upload successful: [track-id]`

5. If there are errors, check Supabase Edge Function logs:
   ```bash
   supabase functions logs audius-upload --tail
   ```

### 5. Verify in Supabase Dashboard

1. Go to **Edge Functions** in your Supabase dashboard
2. Click on `audius-upload`
3. View the **Logs** tab to see upload requests and responses
4. Check for any errors or successful uploads

---

## How It Works

### Request Flow

```
Frontend (Browser)
    ↓
    Creates FormData with:
    - Audio file
    - Cover art (optional)
    - Track metadata (title, genre, tags from room)
    - User OAuth JWT
    ↓
Supabase Edge Function
    ↓
    Validates user authentication
    ↓
    Initializes Audius SDK with API Secret
    ↓
    Calls audiusSdk.tracks.uploadTrack()
    ↓
Audius Protocol
    ↓
    Returns track ID
    ↓
Frontend receives track ID
```

### Security

- ✅ API Secret stored server-side only (Supabase Secrets)
- ✅ User authentication verified via Supabase Auth
- ✅ No sensitive credentials exposed to frontend
- ✅ CORS configured for your domain only

---

## Troubleshooting

### Upload fails with "Missing Audius API credentials"

**Problem:** Edge Function can't access the secrets.

**Solution:**
1. Verify secrets are set: `supabase secrets list`
2. Redeploy the function: `supabase functions deploy audius-upload`

### Upload fails with "Unauthorized"

**Problem:** User is not logged in to Echo.

**Solution:**
1. Ensure user is logged in via Echo auth
2. Check Supabase session is active
3. Verify OAuth token is valid

### Upload fails with Audius SDK error

**Problem:** Issue with Audius API or track format.

**Solution:**
1. Check Edge Function logs: `supabase functions logs audius-upload`
2. Verify audio file is MP3 format (max 100MB)
3. Verify genre is a valid Audius genre
4. Check Audius API status

### Function not found

**Problem:** Edge Function not deployed.

**Solution:**
```bash
supabase functions deploy audius-upload
```

---

## File Changes Summary

### Created Files

- `supabase/functions/audius-upload/index.ts` - Edge Function for secure uploads
- `AUDIUS_UPLOAD_FIX.md` - This documentation

### Modified Files

- `src/hooks/api/useAudiusUpload.ts`
  - Removed direct SDK calls
  - Now calls Supabase Edge Function via `supabase.functions.invoke()`
  - Commented out update/delete hooks (need similar Edge Function treatment)

- `src/components/SubmissionForm.tsx`
  - Added `useRoom` hook to fetch room data
  - Passes `room.genre` and `room.tags` to upload form

- `src/components/upload/AudiusUploadForm.tsx`
  - Accepts `roomGenre` and `roomTags` props
  - Removed genre/mood/description/tags UI fields
  - Uses room-level settings for uploads

---

## Room Genre Configuration

Now that genre is set at the room level, admins can configure this in the Admin Panel:

1. Go to Admin → Select Room → Settings
2. Set **Genre** (e.g., "Electronic", "Trap", "Hip-Hop/Rap")
3. Set **Tags** (comma-separated, e.g., "phonk, bass, trap")
4. Save changes

All tracks uploaded to that room will automatically use these settings.

---

## Future Enhancements

### Planned

- [ ] Edge Functions for track updates (`updateTrack`)
- [ ] Edge Functions for track deletes (`deleteTrack`)
- [ ] Upload progress streaming from Edge Function
- [ ] Batch upload support
- [ ] Track preview/validation before upload

### Database Migration

A migration was created to add genre/tags to rooms:

```sql
-- supabase/migrations/20250102000002_add_room_genre_tags.sql
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS genre TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Set Phonk Monsta room defaults
UPDATE public.rooms
SET
  genre = 'Electronic',
  tags = ARRAY['phonk', 'bass', 'trap']
WHERE slug = 'phonk-monsta';
```

Run this migration if not already applied:
```bash
supabase db push
```

---

## Support

If you encounter issues:

1. Check Edge Function logs: `supabase functions logs audius-upload --tail`
2. Check browser console for frontend errors
3. Verify all secrets are configured correctly
4. Test with a simple MP3 file first
5. Ensure user is authenticated with both Echo and Audius

## References

- [Audius SDK Documentation](https://docs.audius.org/developers/sdk/tracks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Secrets Management](https://supabase.com/docs/guides/functions/secrets)
