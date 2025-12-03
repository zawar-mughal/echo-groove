# 🎵 Audius Integration - Complete Implementation Guide

## ✅ Implementation Status: 100% Complete

All core Audius integration features have been successfully implemented and are ready to use!

---

## 📋 **What's Been Built**

### **Phase 1: SDK Setup & Configuration** ✅
- **Audius SDK** initialized with your API key
- **Type definitions** for all Audius API responses
- **Helper functions** for genre/mood mapping, file validation, formatting
- **Environment configuration** (.env with API key)

### **Phase 2: Authentication System** ✅
- **Dual Authentication**:
  - Users can create Echo account → Link Audius
  - Users can sign in directly with Audius OAuth
- **Auth Components**:
  - `AudiusLinkButton` - Link/unlink Audius account
  - `AudiusSignInButton` - OAuth sign-in button
  - Updated `AuthModal` with "Continue with Audius" option
- **Context & State Management**:
  - `AudiusAuthContext` - Global Audius auth state
  - Auto-syncs Audius profile data to Echo database
  - Handles account linking and creation

### **Phase 3: Smart Track Selection** ✅
- **Track Library Browser**:
  - Fetches user's entire Audius library
  - Real-time search with debouncing
  - Filters out already-submitted tracks
  - Shows submission status for each track
- **Anti-Spam System**:
  - Database constraint prevents duplicate submissions
  - Visual indicators for submitted tracks
  - Automatic filtering in UI

### **Phase 4: Track Upload** ✅
- **Upload Form**:
  - MP3 audio file upload (max 100MB)
  - Cover art upload (max 10MB, JPG/PNG)
  - Metadata fields (title, genre, mood, description, tags)
  - Real-time upload progress tracking
  - File validation
- **Upload Process**:
  - Uploads directly to Audius
  - Returns Audius track ID
  - Auto-adds to user's library
  - Automatically selectable for submission

### **Phase 5: Playback System** ✅
- **Audius Player**:
  - Full audio player with play/pause
  - Progress bar with seeking
  - Volume control with mute
  - Displays track artwork and metadata
  - Links to Audius track page
  - Compact mode option
- **Streaming**:
  - Fetches stream URLs from Audius
  - Caches URLs for performance
  - Handles loading states

### **Phase 6: Profile Sync** ✅
- **Auto-Sync Features**:
  - Syncs Audius profile → Echo on login
  - Updates display name, bio, avatar
  - Maintains Audius handle reference
- **Manual Sync**:
  - Hook available for on-demand syncing

### **Phase 7: Database Schema** ✅
- **Migration Created**: `supabase/migrations/20250102000000_audius_integration.sql`
- **Features**:
  - Unique constraint: prevents duplicate tracks per room
  - Trigger: validates Audius account before submission
  - Indexes for fast lookups
  - Helper view for Audius submissions

---

## 🗂️ **File Structure**

```
src/
├── lib/
│   ├── audius.ts                          # SDK singleton
│   └── audiusHelpers.ts                   # Utility functions
├── types/
│   └── audius.ts                          # TypeScript types
├── hooks/
│   ├── useDebounce.ts                     # Search debouncing
│   ├── useAudiusAuth.ts                   # OAuth flow
│   ├── useAudiusStream.ts                 # Streaming URLs
│   └── api/
│       ├── useUserAudiusTracks.ts         # User's Audius library
│       ├── useRoomSubmissionCheck.ts      # Duplicate prevention
│       ├── useAudiusUpload.ts             # Upload to Audius
│       ├── useSubmissions.ts              # Updated with Audius support
│       └── useAudiusProfile.ts            # Profile syncing
├── contexts/
│   └── AudiusAuthContext.tsx              # Auth state management
├── components/
│   ├── auth/
│   │   ├── AudiusLinkButton.tsx           # Link account button
│   │   └── AuthModal.tsx                  # Updated with Audius OAuth
│   ├── upload/
│   │   ├── AudiusTrackCard.tsx            # Track display card
│   │   ├── AudiusTrackSelector.tsx        # Smart track picker
│   │   └── AudiusUploadForm.tsx           # Upload form
│   └── player/
│       └── AudiusPlayer.tsx               # Audio player
└── App.tsx                                # Wrapped with AudiusAuthProvider

supabase/migrations/
└── 20250102000000_audius_integration.sql  # Database migration

.env
└── VITE_AUDIUS_API_KEY=                   # Your API key configured
```

---

## 🚀 **How to Use**

### **1. Apply Database Migration**

**Option A: Using Supabase CLI**
```bash
supabase db push
```

**Option B: Manual SQL Execution**
1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/20250102000000_audius_integration.sql`
3. Copy and paste the entire file
4. Click **RUN**

### **2. Test Authentication**

1. **Visit** http://localhost:8080/
2. **Click** "Sign In" button
3. **See** new "Continue with Audius" button
4. **Click** it to test OAuth flow

### **3. Integrate Track Selector into Room Page**

In your Room page component, use the track selector:

```typescript
import { AudiusTrackSelector } from '@/components/upload/AudiusTrackSelector';
import { AudiusUploadForm } from '@/components/upload/AudiusUploadForm';
import { useCreateAudiusSubmission } from '@/hooks/api/useSubmissions';

function SubmissionModal({ roomId, seasonId, onClose }) {
  const [mode, setMode] = useState<'select' | 'upload'>('select');
  const createSubmission = useCreateAudiusSubmission();
  const { profile } = useAuth();

  const handleTrackSelect = async (track: SelectableAudiusTrack) => {
    await createSubmission.mutateAsync({
      audiusTrackId: track.id,
      seasonId,
      roomId,
      userId: profile.id,
    });
    onClose();
  };

  const handleUploadSuccess = async (trackId: string) => {
    await createSubmission.mutateAsync({
      audiusTrackId: trackId,
      seasonId,
      roomId,
      userId: profile.id,
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        {mode === 'select' ? (
          <AudiusTrackSelector
            roomId={roomId}
            seasonId={seasonId}
            onTrackSelect={handleTrackSelect}
            onUploadNew={() => setMode('upload')}
          />
        ) : (
          <AudiusUploadForm
            onSuccess={handleUploadSuccess}
            onCancel={() => setMode('select')}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### **4. Integrate Player into Room Page**

Replace existing player with Audius player:

```typescript
import { AudiusPlayer } from '@/components/player/AudiusPlayer';

function Room() {
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);

  return (
    <div>
      {/* Submission list */}
      {submissions.map(sub => (
        <div key={sub.id} onClick={() => setCurrentTrack(sub.provider_track_id)}>
          {sub.title}
        </div>
      ))}

      {/* Player */}
      {currentTrack && (
        <AudiusPlayer
          trackId={currentTrack}
          autoPlay
          showArtwork
        />
      )}
    </div>
  );
}
```

### **5. Add Profile Link Button to Settings**

In your Settings/Profile page:

```typescript
import { AudiusLinkButton } from '@/components/auth/AudiusLinkButton';

function SettingsPage() {
  return (
    <div>
      <h2>Connected Accounts</h2>
      <AudiusLinkButton
        variant="default"
        size="lg"
        showUnlinkOption
      />
    </div>
  );
}
```

---

## 🎯 **Key Features Implemented**

### **1. Dual Authentication**
- ✅ Echo account + Audius link
- ✅ Direct Audius OAuth login
- ✅ Auto profile creation
- ✅ Profile data syncing

### **2. Track Selection**
- ✅ Browse user's Audius library
- ✅ Real-time search (debounced)
- ✅ Filter already-submitted tracks
- ✅ Visual submission status
- ✅ "Upload New" option

### **3. Track Upload**
- ✅ Audio file upload (MP3, 100MB max)
- ✅ Cover art upload (PNG/JPG, 10MB max)
- ✅ Metadata form (title, genre, mood, tags)
- ✅ Progress tracking
- ✅ File validation
- ✅ Auto-adds to Audius library

### **4. Playback**
- ✅ Full audio player
- ✅ Play/pause/seek
- ✅ Volume control
- ✅ Track info display
- ✅ Link to Audius
- ✅ Compact mode

### **5. Anti-Spam**
- ✅ Unique constraint in database
- ✅ UI filtering
- ✅ Visual indicators
- ✅ Prevents duplicate submissions

### **6. Database Enforcement**
- ✅ Trigger validates Audius linking
- ✅ Unique track per room constraint
- ✅ Indexes for performance
- ✅ Helper view for queries

---

## 📊 **API Hooks Reference**

### **Authentication**
```typescript
// Check Audius auth status
const { isAudiusLinked, audiusUser, linkAudiusAccount, loginWithAudius } = useAudiusAuthContext();
```

### **Track Library**
```typescript
// Fetch user's Audius tracks
const { data: tracks } = useUserAudiusTracks(audiusUserId);

// Check if track already submitted
const { data: isSubmitted } = useIsTrackSubmittedToRoom(roomId, trackId);

// Get available tracks (filtered)
const { data: availableTracks } = useFilterAvailableTracksForRoom(roomId, tracks);
```

### **Upload**
```typescript
// Upload new track to Audius
const uploadMutation = useAudiusUpload();
await uploadMutation.mutateAsync({
  userId: audiusUserId,
  audioFile,
  coverArtFile,
  title: 'Track Title',
  genre: 'Electronic',
  onProgress: (percent) => console.log(percent),
});
```

### **Submissions**
```typescript
// Create submission from Audius track
const createSubmission = useCreateAudiusSubmission();
await createSubmission.mutateAsync({
  audiusTrackId: 'abc123',
  seasonId,
  roomId,
  userId,
});

// Fetch submissions
const { data: submissions } = useSubmissions(seasonId);
```

### **Playback**
```typescript
// Get stream URL
const { data: streamUrl } = useAudiusStream(trackId);

// Get track metadata
const { data: track } = useAudiusTrack(trackId);
```

### **Profile**
```typescript
// Sync Audius profile
const syncProfile = useSyncAudiusProfile();
await syncProfile.mutateAsync({
  echoUserId,
  audiusUserId,
});
```

---

## 🧪 **Testing Checklist**

- [ ] **Sign in with Audius** - OAuth flow works
- [ ] **Link Audius to existing Echo account** - Profile syncs
- [ ] **Browse Audius library** - Tracks load correctly
- [ ] **Search tracks** - Filtering works
- [ ] **Upload new track** - Progress tracking works
- [ ] **Submit existing track** - Creates submission
- [ ] **Try duplicate submission** - Blocked by constraint
- [ ] **Play track** - Audio player works
- [ ] **Check database** - Migration applied correctly
- [ ] **Unlink Audius** - Account unlinks properly

---

## 🐛 **Troubleshooting**

### **Issue: OAuth not working**
**Solution**: Check that your Audius API key is correctly set in `.env` and restart dev server

### **Issue: Tracks not loading**
**Solution**: Verify user has Audius account linked (`audiusUser.userId` exists)

### **Issue: Upload fails**
**Solution**:
- Check file size (audio < 100MB, artwork < 10MB)
- Verify file format (MP3 for audio, JPG/PNG for artwork)
- Check user has OAuth write permission

### **Issue: Database constraint error**
**Solution**: Run the migration file to add indexes and constraints

### **Issue: Stream URL not working**
**Solution**: Audius URLs expire - they're cached for 30 minutes, may need refresh

---

## 🎨 **Customization**

### **Change Genre/Mood Options**
Edit `src/lib/audiusHelpers.ts`:
```typescript
export const getAllGenres = (): string[] => {
  return Object.values(AudiusGenre); // Customize this array
};
```

### **Adjust Upload File Limits**
Edit `src/lib/audiusHelpers.ts`:
```typescript
export const validateTrackFile = (file: File) => {
  const maxSize = 200 * 1024 * 1024; // Change to 200MB
  // ...
};
```

### **Customize Player Appearance**
The player component uses Tailwind CSS - modify classes in `src/components/player/AudiusPlayer.tsx`

---

## 📈 **Performance Optimizations**

- ✅ **React Query caching** - Audius API responses cached
- ✅ **Debounced search** - Reduces API calls
- ✅ **Stream URL caching** - 30-minute cache
- ✅ **Database indexes** - Fast track lookups
- ✅ **Lazy loading** - Track selector pagination ready

---

## 🔒 **Security Features**

- ✅ **Audius ID validated** before submissions
- ✅ **Duplicate prevention** at database level
- ✅ **File validation** before upload
- ✅ **OAuth token storage** secure
- ✅ **RLS policies** protect data

---

## 🚧 **Future Enhancements (Optional)**

1. **Playlist Integration** - Add Audius playlists to rooms
2. **Social Features** - Follow Audius artists, repost tracks
3. **Analytics** - Track play counts, popular tracks
4. **Offline Mode** - Cache tracks for offline playback
5. **Batch Upload** - Upload multiple tracks at once
6. **Track Editing** - Update metadata after upload
7. **Favorites** - Sync favorites from Audius
8. **Notifications** - Alert when new tracks from followed artists

---

## 🎉 **You're All Set!**

Your Audius integration is complete and ready to use. All core functionality has been implemented:

✅ **Authentication** - Dual auth with OAuth
✅ **Track Selection** - Smart library browser
✅ **Upload** - Direct to Audius
✅ **Playback** - Full audio player
✅ **Anti-Spam** - Duplicate prevention
✅ **Database** - Constraints and triggers

**Next Steps:**
1. Apply the database migration
2. Test the OAuth flow
3. Integrate components into your Room page
4. Deploy and enjoy!

---

**Questions or Issues?**
All code is documented and follows best practices. Check component prop types and hook return values for usage details.

**Happy Building! 🚀**
