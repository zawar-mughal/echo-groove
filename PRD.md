# Product Requirements Document (PRD)
## Echo Groove Battle

**Version:** 1.0
**Last Updated:** 2025-11-06
**Document Owner:** Product Team
**Target Audience:** DevOps, QA, Infrastructure Engineering

---

## 1. Executive Summary

Echo Groove Battle is a competitive music curation and voting platform that enables communities to discover and promote emerging music through gamified battles. Users submit tracks from decentralized music platforms (primarily Audius), vote on submissions through a "boost" mechanism, and earn platform points based on their curation accuracy and community engagement.

### Key Differentiators
- Integration with Audius decentralized music platform
- Season-based competition structure within community rooms
- Dual points system (Community Points + Curator Points)
- Real-time trending algorithm based on boost velocity
- Anonymous participation with upgrade path to authenticated users

---

## 2. Technical Architecture

### 2.1 Stack Overview

**Frontend**
- Framework: React 18 + TypeScript
- Build Tool: Vite 5.x
- UI Library: shadcn-ui (Radix UI primitives)
- Styling: Tailwind CSS
- State Management: TanStack Query (React Query)
- Routing: React Router v6

**Backend**
- Database: Supabase (PostgreSQL 13+)
- Authentication: Supabase Auth + OAuth integrations
- Edge Functions: Supabase Edge Functions (Deno runtime)
- File Storage: Supabase Storage (for uploads) + External CDNs

**External Services**
- Music Platform: Audius Protocol
- Deployment: Vercel (frontend)
- Upload Service: Fly.io (audius-upload-service)

### 2.2 Infrastructure Requirements

```
Frontend:
├── CDN: Global edge network for static assets
├── Compute: Serverless (Vercel)
├── Memory: ~512MB per instance
└── Build: Node.js 18+ environment

Backend:
├── Database: PostgreSQL 13+ with pgvector, pg_trgm extensions
├── Compute: Supabase Edge Functions (Deno)
├── Storage: Object storage for media thumbnails
└── Redis/Cache: Session management (via Supabase)

External:
├── Audius Discovery Nodes: Multiple endpoints for redundancy
└── Upload Service: Fly.io deployment (audius-upload-service)
```

### 2.3 Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                   │
│                  (Frontend - React SPA)                  │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ HTTPS
                  │
┌─────────────────▼───────────────────────────────────────┐
│                  Supabase Platform                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │  PostgreSQL  │  │ Edge Functions│  │ Storage/CDN   │ │
│  │   Database   │  │    (Deno)     │  │   (Media)     │ │
│  └──────────────┘  └──────────────┘  └───────────────┘ │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ External APIs
                  │
┌─────────────────▼───────────────────────────────────────┐
│              External Services                           │
│  ┌──────────────────┐        ┌──────────────────────┐  │
│  │ Audius Discovery │        │  Upload Service      │  │
│  │   Nodes (CDN)    │        │    (Fly.io)          │  │
│  └──────────────────┘        └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Core Features & Functionality

### 3.1 User Personas

1. **Anonymous Visitor**: Can browse, listen to tracks, limited voting (3 boosts per session)
2. **Authenticated User**: Full platform access, unlimited voting, points earning
3. **Room Admin**: Create seasons, manage submissions, curate playlists, moderate content
4. **Platform Admin**: Full system access, user management, global moderation

### 3.2 Feature Breakdown

#### 3.2.1 Rooms (Community Spaces)
- **Description**: Independent communities focused on specific music genres/themes
- **Capabilities**:
  - Room discovery and browsing
  - Search functionality
  - Room-specific playlists
  - Stats tracking (members, submissions, seasons)
- **Access Control**: Public rooms (open) or Private rooms (invite-only)

#### 3.2.2 Seasons (Competition Periods)
- **Description**: Time-bound battle periods within rooms (typically 1-4 weeks)
- **Lifecycle States**:
  - `upcoming`: Scheduled but not started
  - `active`: Accepting submissions
  - `completed`: Ended, results finalized
- **Configuration**:
  - Start/end dates
  - Max submissions per user
  - Duration limits (min/max seconds)
  - Media type restrictions
  - File size limits

#### 3.2.3 Submissions (Track Entries)
- **Sources**:
  - Audius platform (primary integration)
- **Metadata**:
  - Title, artist, duration
  - Thumbnail/artwork
  - External URL
  - Provider track ID
- **Moderation**:
  - Auto-approval or manual review
  - Visibility toggles
  - Admin notes

#### 3.2.4 Boosts (Voting Mechanism)
- **Behavior**:
  - One boost per user per submission
  - No "un-boost" functionality
  - Real-time boost count updates
  - Velocity-based trending calculation
- **Throttling**:
  - Anonymous users: 3 boosts per session (localStorage)
  - Authenticated users: Unlimited
- **Points Earning**:
  - Community Points: Earned for all boosts
  - Curator Points: Earned when boosted tracks make playlist (rewards early discovery)
  - Early Booster Bonus: Extra points for boosting before trending

#### 3.2.5 Playlists
- **Types**:
  - Room Playlist: Curated "best of" tracks from all seasons
  - Season Winners: Top tracks from completed seasons
- **Features**:
  - Manual curation by admins
  - Shuffle playback
  - Duration and season stats
  - Track positioning

#### 3.2.6 Points System
- **Community Points**: Social engagement metric
- **Curator Points**: Curation accuracy metric
- **Platform Points**: Combined total for leaderboards
- **Tracking**:
  - Daily aggregation
  - Historical tracking
  - Room-specific scoring
  - Streak bonuses

#### 3.2.7 User Profiles
- **Data**:
  - Username, display name, bio
  - Avatar (Audius profile or custom upload)
  - Points breakdown (community, curator, total)
  - Submission history
  - Boost activity
  - Streaks (current, longest)
- **Integrations**:
  - Audius account linking

#### 3.2.8 Admin Panel
- **Room Management**:
  - Create/edit/archive rooms
  - Set moderators
  - Configure settings
- **Season Management**:
  - Create/edit seasons
  - Set constraints and rules
  - End seasons early
- **Content Moderation**:
  - Approve/reject submissions
  - Hide inappropriate content
  - Ban users
- **Analytics**:
  - Engagement metrics
  - Popular tracks
  - User growth

---

## 4. Data Model

### 4.1 Core Entities

```
profiles (users)
├── id (uuid, PK)
├── username (unique)
├── display_name
├── avatar_url
├── audius_id, audius_handle, audius_jwt
├── community_points, curator_points, platform_points
├── total_boosts, total_submissions
├── current_streak, longest_streak
├── is_admin
└── notification preferences

rooms
├── id (uuid, PK)
├── slug (unique)
├── title, description
├── genre, tags[]
├── created_by (FK → profiles)
├── moderator_ids[]
├── is_public, is_active, allow_submissions
├── discord_guild_id, discord_channel_id
└── stats (total_members, total_seasons, total_submissions)

seasons
├── id (uuid, PK)
├── room_id (FK → rooms)
├── title, description
├── start_date, end_date, voting_end_date
├── status (enum)
├── media_type, constraints
├── participant_count, submission_count, total_boosts
└── timestamps

submissions
├── id (uuid, PK)
├── season_id (FK → seasons)
├── room_id (FK → rooms)
├── user_id (FK → profiles)
├── title, description
├── provider (audius|soundcloud|youtube|upload)
├── provider_track_id
├── external_url, storage_path, thumbnail_path
├── duration_seconds, file_size_bytes
├── media_type
├── boost_count, weighted_boost_count, unique_boosters
├── boost_velocity, trending_score, is_trending
├── play_count
├── is_approved, is_visible
└── timestamps

boosts
├── id (uuid, PK)
├── submission_id (FK → submissions)
├── user_id (FK → profiles)
├── season_id (FK → seasons)
├── weight (default 1.0)
└── created_at

playlists
├── id (uuid, PK)
├── room_id (FK → rooms)
├── title, description
├── curated_by (FK → profiles)
├── is_featured
├── track_count, total_duration_seconds
└── timestamps

playlist_tracks
├── id (uuid, PK)
├── playlist_id (FK → playlists)
├── submission_id (FK → submissions)
├── season_id (FK → seasons)
├── position (order)
├── added_by (FK → profiles)
└── added_at
```

### 4.2 Supporting Tables

- `boost_history`: Aggregated boost data per user per submission
- `daily_points`: Daily points earned by users
- `play_events`: Track playback analytics
- `room_memberships`: User-room relationships
- `room_admins`: Room-level permissions
- `user_room_scores`: Per-room user statistics
- `admin_logs`: Audit trail

### 4.3 Database Functions

- `calculate_boost_velocity()`: Real-time trending calculation
- `update_trending_submissions()`: Batch trending updates
- `update_user_curator_stats()`: Points recalculation
- `reset_daily_boost_counts()`: Daily throttle reset
- `is_room_admin()`, `can_manage_seasons()`: Permission checks

---

## 5. Authentication & Authorization

### 5.1 Authentication Methods

1. **Supabase Magic Link**: Email-based passwordless login
2. **Audius OAuth**: Connect Audius account for profile sync
3. **Anonymous Mode**: Temporary guest access with localStorage tracking

### 5.2 Authorization Levels

```
┌─────────────────────────────────────────────────────────┐
│ Platform Admin                                          │
│ ├─ Full system access                                   │
│ ├─ User management                                      │
│ └─ Global moderation                                    │
└─────────────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────┐
│ Room Admin                                              │
│ ├─ Room settings                                        │
│ ├─ Season management                                    │
│ ├─ Content moderation (room-specific)                   │
│ └─ Playlist curation                                    │
└─────────────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────┐
│ Authenticated User                                      │
│ ├─ Unlimited boosts                                     │
│ ├─ Track submissions                                    │
│ ├─ Points earning                                       │
│ └─ Profile management                                   │
└─────────────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────┐
│ Anonymous User                                          │
│ ├─ Browse rooms/tracks                                  │
│ ├─ Listen to tracks                                     │
│ ├─ Limited boosts (3 per session)                       │
│ └─ No points earning                                    │
└─────────────────────────────────────────────────────────┘
```

### 5.3 Row-Level Security (RLS)

All Supabase tables use RLS policies:
- **profiles**: Users can read all, update own
- **rooms**: Public rooms readable by all, admins can modify
- **seasons**: Readable by all, admins can CRUD
- **submissions**: Readable by all, creators can delete own (if allowed)
- **boosts**: Users can insert own, read all counts
- **playlists**: Readable by all, curators can modify

---

## 6. Third-Party Integrations

### 6.1 Audius Integration

**Purpose**: Decentralized music platform for track streaming and artist profiles

**Endpoints**:
- Discovery Nodes: `https://discoveryprovider.audius.co` (with fallback nodes)
- API Docs: https://docs.audius.org

**Integration Points**:
1. **Track Search**: Search Audius catalog for submissions
2. **Track Streaming**: Stream audio via Audius CDN
3. **User OAuth**: Login with Audius account
4. **Profile Sync**: Fetch user avatar, handle, followers
5. **Track Metadata**: Title, artist, artwork, duration

**Rate Limits**:
- 500 requests/hour per API key (confirmed with Audius team)
- Implement client-side caching with React Query (5min stale time)

**Error Handling**:
- Fallback to alternate discovery nodes on failure
- Graceful degradation if track unavailable
- Display cached metadata when possible

**Audius SDK**:
```typescript
import { sdk } from '@audius/sdk'

const audiusSdk = sdk({
  appName: 'Echo Groove Battle',
  apiKey: process.env.VITE_AUDIUS_API_KEY
})
```

### 6.3 Upload Service (Fly.io)

**Purpose**: Proxy for Audius uploads and metadata operations

**Endpoint**: `https://echo-upload-service.fly.dev` (configurable)

**Functions**:
- `/upload`: Upload tracks to Audius
- `/metadata`: Fetch/update track metadata

---

## 7. Performance Requirements

### 7.1 Response Time Targets

| Operation | Target | Acceptable | Notes |
|-----------|--------|------------|-------|
| Page Load (Home) | < 1.5s | < 3s | First Contentful Paint |
| Page Load (Room) | < 2s | < 4s | Includes data fetch |
| Boost Action | < 500ms | < 1s | UI should update immediately (optimistic) |
| Search | < 1s | < 2s | Debounced input |
| Track Play Start | < 2s | < 4s | Depends on Audius CDN |
| Admin Actions | < 2s | < 5s | Season create, room update |

### 7.2 Scalability Targets

**Phase 1 (MVP)**:
- 100 concurrent users
- 10 active rooms
- 1,000 submissions/month
- 10,000 boosts/month

**Phase 2 (Growth)**:
- 1,000 concurrent users
- 100 active rooms
- 10,000 submissions/month
- 100,000 boosts/month

**Phase 3 (Scale)**:
- 10,000+ concurrent users
- 1,000+ active rooms
- 100,000+ submissions/month
- 1M+ boosts/month

### 7.3 Database Performance

**Critical Queries**:
1. **Fetch Room Submissions** (most frequent):
   ```sql
   SELECT * FROM submissions
   WHERE season_id = $1
   ORDER BY boost_count DESC, created_at DESC
   ```
   - Target: < 200ms
   - Index: `(season_id, boost_count DESC, created_at DESC)`

2. **Fetch User Boosts** (per room load):
   ```sql
   SELECT submission_id FROM boosts
   WHERE user_id = $1 AND season_id = $2
   ```
   - Target: < 100ms
   - Index: `(user_id, season_id, submission_id)`

3. **Trending Calculation** (scheduled job):
   ```sql
   SELECT calculate_boost_velocity(submission_id)
   FROM submissions WHERE season_id = $1
   ```
   - Target: < 5s for 1000 submissions
   - Run via cron: Every 5 minutes

**Connection Pooling**:
- Supabase default: 15 connections per project (Free tier)
- Recommended: Upgrade to Pro for 60+ connections at scale

### 7.4 Caching Strategy

**Frontend (React Query)**:
- Rooms list: 5 min stale time
- Season data: 5 min stale time
- Submissions: 5 min stale time, refetch on window focus
- User profile: 10 min stale time

**Backend**:
- Supabase PostgREST has built-in ETag caching
- Audius API responses: Cache in localStorage (1 hour)

**CDN**:
- Static assets: Vercel Edge Network (automatic)
- Track thumbnails: Supabase Storage CDN
- Audio streams: Audius CDN (external)

---

## 8. Testing Scenarios

### 8.1 Functional Testing

#### User Flows
1. **Anonymous User Journey**:
   - [ ] Browse homepage and view room cards
   - [ ] Navigate to room and view season submissions
   - [ ] Listen to tracks (play/pause/seek)
   - [ ] Boost 3 tracks successfully
   - [ ] Attempt 4th boost → see login prompt
   - [ ] Close login modal and continue browsing

2. **User Registration & Authentication**:
   - [ ] Click "Sign In" → enter email → receive magic link
   - [ ] Click magic link → redirected to app, logged in
   - [ ] View profile page with default username
   - [ ] Edit profile (username, display name, bio)
   - [ ] Connect Audius account via OAuth
   - [ ] Verify Audius profile sync (avatar, handle)

3. **Track Submission**:
   - [ ] Navigate to active room with open season
   - [ ] Click "Submit Track" → opens modal
   - [ ] Search Audius for track by title/artist
   - [ ] Select track → verify metadata preview (title, artist, duration, artwork)
   - [ ] Add optional description
   - [ ] Submit → track appears in season list
   - [ ] Verify cannot submit duplicate in same season
   - [ ] Verify cannot exceed max submissions per user

4. **Voting & Boosts**:
   - [ ] Boost a track → boost count increments immediately
   - [ ] Refresh page → boost persists
   - [ ] Attempt to boost same track again → no change (idempotent)
   - [ ] Boost multiple tracks → see boost indicators on all boosted tracks
   - [ ] Watch trending track (velocity-based) appear with trending badge

5. **Playlist Playback**:
   - [ ] Navigate to "Room Playlist" tab
   - [ ] Click shuffle → random track plays
   - [ ] Track ends → next random track auto-plays
   - [ ] Pause → playback stops
   - [ ] Click specific track → that track plays immediately

6. **Admin Room Management**:
   - [ ] Login as admin → see "Admin" link in nav
   - [ ] Navigate to Admin → see rooms list
   - [ ] Create new room → enter title, slug, description, settings
   - [ ] Verify slug uniqueness validation
   - [ ] Edit room settings → changes persist
   - [ ] Create season → set dates, constraints, media type
   - [ ] End season early → status changes to "completed"

7. **Profile & Points**:
   - [ ] View own profile → see points breakdown
   - [ ] Verify boost activity tracked
   - [ ] Check daily boost count increments
   - [ ] Verify community points earned after boosting
   - [ ] Wait for season to end → check curator points earned for tracks that made playlist

### 8.2 Integration Testing

1. **Audius API Integration**:
   - [ ] Search tracks with various queries (empty, special chars, long strings)
   - [ ] Handle API errors gracefully (500, timeout, rate limit)
   - [ ] Verify fallback to alternate discovery nodes on primary failure
   - [ ] Test track streaming with invalid track IDs
   - [ ] Verify OAuth flow with Audius (redirect, token exchange, profile fetch)

2. **Supabase Integration**:
   - [ ] Test RLS policies (users cannot modify others' profiles)
   - [ ] Verify real-time subscriptions (boost count updates across clients)
   - [ ] Test file upload to Supabase Storage (thumbnails)
   - [ ] Verify Edge Function invocations (audius-upload)
   - [ ] Test auth state persistence across page reloads

3. **Discord Webhooks** (if enabled):
   - [ ] Create season → webhook sent to Discord channel
   - [ ] New submission → notification posted
   - [ ] Season ends → winner announcement posted

### 8.3 Performance Testing

**Load Testing Scenarios**:

1. **Concurrent Users - Room Page**:
   - Simulate 100 users loading same room simultaneously
   - Verify DB connection pool doesn't exhaust
   - Monitor response times stay < 4s at p95

2. **Boost Spam**:
   - Simulate 50 users boosting different tracks rapidly (10 boosts/sec)
   - Verify boost counts remain accurate
   - Check DB doesn't deadlock on concurrent inserts

3. **Large Dataset**:
   - Create room with 1000 submissions in single season
   - Load room page → verify loads in < 5s
   - Test filtering and sorting performance

4. **Trending Calculation**:
   - Run `update_trending_submissions()` with 10,000 submissions
   - Verify completes in < 30s
   - Check trending badges update correctly

**Tools**:
- Artillery or k6 for load testing
- Supabase Dashboard for DB performance monitoring
- Vercel Analytics for frontend performance
- Chrome DevTools for Core Web Vitals

### 8.4 Security Testing

1. **Authentication Bypass**:
   - [ ] Attempt to access admin routes without admin role
   - [ ] Try to modify other users' profiles via API
   - [ ] Test RLS policies with direct DB queries

2. **Injection Attacks**:
   - [ ] Submit XSS payloads in room titles, descriptions
   - [ ] Test SQL injection in search queries
   - [ ] Verify input sanitization on all forms

3. **Rate Limiting**:
   - [ ] Attempt to boost > 3 times as anonymous user
   - [ ] Verify localStorage throttle cannot be bypassed easily
   - [ ] Test API rate limits with burst requests

4. **Authorization**:
   - [ ] Non-admin tries to create season → blocked
   - [ ] User tries to delete another user's submission → blocked
   - [ ] Verify JWT expiration and refresh logic

### 8.5 Edge Cases

1. **Concurrent Modifications**:
   - Two admins editing same room simultaneously
   - User submits track while season ends
   - Multiple users boost same track at exact same time

2. **Data Consistency**:
   - Season end date in past → auto-complete season
   - Submission with deleted user → handle gracefully
   - Boost for deleted submission → cascade delete

3. **External Service Failures**:
   - Audius API down → show cached data, disable submissions
   - Audius CDN slow → show loading state, timeout after 10s
   - Upload service unavailable → disable upload functionality

4. **Browser Compatibility**:
   - Test on Chrome, Firefox, Safari, Edge (latest 2 versions)
   - Verify mobile responsive design (iOS Safari, Chrome Android)
   - Test audio playback on all browsers

---

## 9. DevOps & Infrastructure

### 9.1 Deployment Pipeline

**Frontend (Vercel)**:
```
main branch → Auto-deploy to Production
├─ Build: npm run build (Vite production build)
├─ Environment: VITE_* env vars from Vercel dashboard
├─ Previews: Auto-deploy for PRs
└─ Rollback: Instant rollback to previous deployment
```

**Backend (Supabase)**:
```
Migrations → Applied via Supabase CLI
├─ Development: Local Supabase instance (Docker)
├─ Staging: supabase db push (staging project)
├─ Production: supabase db push (production project)
└─ Rollback: Manual migration reversal
```

**Edge Functions (Supabase)**:
```
Functions → Deploy via Supabase CLI
├─ audius-upload: Track upload proxy
├─ audius-config: Configuration fetcher
└─ Deploy: supabase functions deploy <function-name>
```

### 9.2 Environment Variables

**Frontend (Vercel)**:
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_AUDIUS_API_KEY=xxx
VITE_AUDIUS_APP_NAME=Echo Groove Battle
VITE_AUDIUS_API_URL=https://discoveryprovider.audius.co
VITE_SITE_URL=https://echogroovebattle.com
VITE_UPLOAD_SERVICE_URL=https://echo-upload-service.fly.dev
```

**Backend (Supabase Functions)**:
```bash
AUDIUS_API_KEY=xxx
AUDIUS_API_SECRET=xxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... (for admin operations)
```

### 9.3 Database Migrations

**Migration Strategy**:
- All schema changes via Supabase migrations (SQL files in `/supabase/migrations/`)
- Use descriptive filenames: `YYYYMMDDHHMMSS_description.sql`
- Test migrations on staging before production
- Backup database before major migrations

**Critical Migrations**:
1. Initial schema setup
2. RLS policies
3. Indexes for performance
4. Database functions (trending, velocity)
5. Scheduled jobs (cron)

**Example Migration**:
```sql
-- Create submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  boost_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX idx_submissions_season_boosts
ON submissions(season_id, boost_count DESC, created_at DESC);

-- Enable RLS
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read approved submissions
CREATE POLICY "Public can view approved submissions"
ON submissions FOR SELECT
USING (is_approved = true AND is_visible = true);
```

### 9.4 Monitoring & Observability

**Application Monitoring**:
- Vercel Analytics: Web vitals, page load times
- Supabase Dashboard: DB queries, connection pool, storage usage
- Error Tracking: Sentry (recommended, not yet implemented)

**Database Monitoring**:
- Query performance: Supabase SQL Editor → EXPLAIN ANALYZE
- Connection pool usage: Dashboard → Database → Connection pooling
- Table sizes: `pg_total_relation_size()`
- Index usage: `pg_stat_user_indexes`

**Key Metrics to Track**:
1. **Frontend**:
   - First Contentful Paint (FCP)
   - Time to Interactive (TTI)
   - Cumulative Layout Shift (CLS)
   - Error rate (5xx, 4xx)

2. **Backend**:
   - Query response times (p50, p95, p99)
   - DB connection pool saturation
   - API endpoint latency
   - Error rates per endpoint

3. **Business**:
   - Daily Active Users (DAU)
   - Boost rate (boosts per user per session)
   - Submission rate
   - Retention (D1, D7, D30)

**Alerting** (recommended setup):
- Slack/Discord notifications for:
  - Production errors (> 10 errors/min)
  - Database connection pool > 80%
  - API response time p95 > 5s
  - Deployment failures

### 9.5 Backup & Disaster Recovery

**Database Backups**:
- Supabase automatic daily backups (retained 7 days on Free, 30 days on Pro)
- Weekly manual exports via `pg_dump` for long-term retention
- Test restore process quarterly

**Recovery Time Objective (RTO)**: < 4 hours
**Recovery Point Objective (RPO)**: < 24 hours

**Disaster Scenarios**:
1. **Database corruption**: Restore from latest backup
2. **Supabase outage**: Wait for service restoration (SLA: 99.9%)
3. **Vercel outage**: Deploy to backup host (Netlify)
4. **Audius API down**: Display cached data, disable submissions temporarily

### 9.6 Scaling Strategy

**Vertical Scaling (Database)**:
- Free tier: 500MB database, 1GB bandwidth
- Pro tier: 8GB database, 50GB bandwidth
- Upgrade to dedicated compute for high load

**Horizontal Scaling (Frontend)**:
- Vercel automatically scales edge network
- No additional configuration needed

**Database Optimization**:
- Implement connection pooling (Supabase Pooler mode)
- Add read replicas for analytics queries (Pro+)
- Partition large tables (submissions, boosts) by date if > 10M rows

**Caching**:
- Redis layer for frequently accessed data (trending tracks, room stats)
- Implement at application layer via Upstash Redis

---

## 10. Security Considerations

### 10.1 Threat Model

**Assets to Protect**:
1. User data (emails, profiles, points)
2. Admin privileges (season creation, moderation)
3. Voting integrity (prevent boost manipulation)
4. API keys (Audius, Supabase)

**Potential Threats**:
1. **Boost manipulation**: Bots creating accounts to boost specific tracks
2. **Admin impersonation**: Unauthorized access to admin panel
3. **Data breach**: Exposure of user emails or API keys
4. **XSS/Injection**: Malicious content in submissions
5. **DDoS**: Overwhelming server with requests

### 10.2 Security Controls

**Authentication**:
- Supabase Auth with JWT tokens (short-lived: 1 hour)
- Email verification required for magic links
- Rate limiting on login attempts (Supabase built-in)

**Authorization**:
- Row-Level Security (RLS) on all tables
- Function-level permissions checks (`is_room_admin()`, etc.)
- Admin role verified via `profiles.is_admin` column

**Input Validation**:
- Frontend: React Hook Form + Zod schemas
- Backend: PostgreSQL constraints + Supabase validations
- Sanitize user-generated content (room titles, descriptions)

**API Security**:
- API keys stored in environment variables (never in code)
- Supabase anon key safe for client-side (RLS enforced)
- Service role key only used in Edge Functions (server-side)

**Data Protection**:
- HTTPS enforced (Vercel automatic)
- Database encrypted at rest (Supabase default)
- Sensitive fields (JWT, API keys) not exposed in API responses

**Rate Limiting**:
- Anonymous boost throttling (client-side: localStorage)
- Authenticated boost throttling (server-side: daily_boost_count)
- Supabase API rate limits (per project)

### 10.3 Compliance

**GDPR Considerations**:
- Users can delete accounts (cascade delete profile data)
- Minimal data collection (email, username, optional bio)
- No third-party trackers (except Vercel Analytics, privacy-friendly)

**Content Moderation**:
- Admin approval required for submissions (optional per room)
- Moderation notes field for admin review
- Ability to hide inappropriate submissions

---

## 11. Success Metrics & KPIs

### 11.1 Product Metrics

**Engagement**:
- Daily Active Users (DAU) / Monthly Active Users (MAU)
- Average session duration
- Boosts per user per session
- Submission rate (submissions per active room per week)

**Retention**:
- Day 1, Day 7, Day 30 retention
- Weekly returning users
- Churn rate

**Growth**:
- New user signups per week
- Room creation rate
- Viral coefficient (invites sent → new users)

### 11.2 Technical Metrics

**Performance**:
- Page load time (p95 < 3s)
- API response time (p95 < 1s)
- Error rate (< 1% of requests)
- Uptime (> 99.5%)

**Infrastructure**:
- Database size growth rate
- Bandwidth usage
- Connection pool utilization
- Storage usage (thumbnails)

---

## 12. Open Questions & Future Considerations

### 12.1 Known Limitations
- No mobile native app (PWA planned)
- Limited analytics/dashboards for users
- No direct messaging between users
- No NFT/token integration (future blockchain tie-in)
- No advanced search (fuzzy matching, filters)

### 12.2 Future Roadmap
1. **Q2 2025**: YouTube and SoundCloud integrations
2. **Q3 2025**: Mobile app (React Native)
3. **Q4 2025**: Tokenomics (on-chain points, NFT badges)
4. **Q1 2026**: Advanced curator analytics dashboard
5. **Q2 2026**: Collaborative playlists, user-to-user messaging

### 12.3 Questions for Stakeholders
- What is acceptable downtime for scheduled maintenance?
- Should we implement geofencing/CDN optimization for specific regions?
- What is budget for infrastructure costs at scale (Pro tier = $25/mo)?
- Do we need SOC2 compliance for enterprise users?

---

## 13. Glossary

- **Boost**: A vote/upvote for a submission
- **Room**: A community space for music battles
- **Season**: A time-bound competition period within a room
- **Submission**: A track entry in a season
- **Playlist**: A curated collection of tracks from a room
- **Curator Points**: Points earned for discovering tracks that later make playlists
- **Community Points**: Points earned for general engagement (boosts)
- **Trending**: A submission with high recent boost velocity
- **Velocity**: Rate of boost accumulation (boosts per hour)
- **RLS**: Row-Level Security (PostgreSQL feature)
- **Edge Function**: Serverless function running on Deno runtime

---

## 14. Appendix

### 14.1 API Endpoints (Supabase)

**REST API** (auto-generated via PostgREST):
```
GET    /rest/v1/rooms?select=*
GET    /rest/v1/seasons?room_id=eq.<uuid>&status=eq.active
GET    /rest/v1/submissions?season_id=eq.<uuid>
POST   /rest/v1/boosts
POST   /rest/v1/submissions
PATCH  /rest/v1/profiles?id=eq.<uuid>
```

**Edge Functions**:
```
POST   /functions/v1/audius-upload
GET    /functions/v1/audius-config
```

### 14.2 Database Indexes

**Performance-critical indexes**:
```sql
CREATE INDEX idx_submissions_season_boosts ON submissions(season_id, boost_count DESC, created_at DESC);
CREATE INDEX idx_submissions_trending ON submissions(is_trending, trending_score DESC);
CREATE INDEX idx_boosts_user_season ON boosts(user_id, season_id, submission_id);
CREATE INDEX idx_seasons_room_status ON seasons(room_id, status);
CREATE INDEX idx_playlists_room ON playlists(room_id, is_featured);
```

### 14.3 Useful Commands

**Development**:
```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > src/types/database.ts

# Start dev server
npm run dev

# Build for production
npm run build
```

**Deployment**:
```bash
# Deploy to Vercel
vercel --prod

# Deploy Edge Function
supabase functions deploy audius-upload

# Run migrations on production
supabase db push --db-url <production-db-url>
```

---

## Document Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-06 | Product Team | Initial PRD creation |

---

**Document Status**: Draft for Review
**Next Review Date**: 2025-12-01
**Feedback**: Submit issues to product team or create GitHub issue
