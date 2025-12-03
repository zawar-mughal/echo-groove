-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =====================================================
-- USERS & PROFILES
-- =====================================================

-- Extends Supabase auth.users with profile data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,

  -- External provider links
  audius_id TEXT,
  audius_handle TEXT,
  soundcloud_id TEXT,
  youtube_id TEXT,

  -- Platform stats (denormalized for performance)
  total_boosts INTEGER DEFAULT 0,
  total_submissions INTEGER DEFAULT 0,
  community_points INTEGER DEFAULT 0,
  curator_points INTEGER DEFAULT 0,
  platform_points INTEGER DEFAULT 0,

  -- Participation tracking
  daily_boost_count INTEGER DEFAULT 0,
  last_boost_date DATE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,

  -- Settings
  is_admin BOOLEAN DEFAULT FALSE,
  email_notifications BOOLEAN DEFAULT TRUE,
  discord_notifications BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$')
);

-- Index for lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_audius_id ON public.profiles(audius_id) WHERE audius_id IS NOT NULL;
CREATE INDEX idx_profiles_platform_points ON public.profiles(platform_points DESC);

-- =====================================================
-- ROOMS
-- =====================================================

CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,

  -- Creator & moderation
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderator_ids UUID[] DEFAULT ARRAY[]::UUID[],

  -- Discord integration
  discord_guild_id TEXT,
  discord_channel_id TEXT,

  -- Room settings
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,
  allow_submissions BOOLEAN DEFAULT TRUE,

  -- Featured content
  featured_submission_id UUID, -- FK added later

  -- Stats (denormalized)
  total_submissions INTEGER DEFAULT 0,
  total_seasons INTEGER DEFAULT 0,
  total_members INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX idx_rooms_slug ON public.rooms(slug);
CREATE INDEX idx_rooms_created_by ON public.rooms(created_by);
CREATE INDEX idx_rooms_active ON public.rooms(is_active) WHERE is_active = TRUE;

-- =====================================================
-- SEASONS
-- =====================================================

CREATE TYPE season_status AS ENUM ('upcoming', 'active', 'voting', 'completed', 'cancelled');
CREATE TYPE media_type AS ENUM ('audio', 'video', 'image', 'mixed');

CREATE TABLE public.seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,

  -- Media constraints
  media_type media_type DEFAULT 'audio',

  -- Timing
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  voting_end_date TIMESTAMPTZ, -- If NULL, voting ends with end_date

  status season_status DEFAULT 'upcoming',

  -- Submission rules
  max_submissions_per_user INTEGER DEFAULT 1,
  min_duration_seconds INTEGER,
  max_duration_seconds INTEGER,
  max_file_size_mb INTEGER DEFAULT 100,

  -- Stats (denormalized)
  submission_count INTEGER DEFAULT 0,
  total_boosts INTEGER DEFAULT 0,
  participant_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_voting_date CHECK (voting_end_date IS NULL OR voting_end_date >= end_date)
);

CREATE INDEX idx_seasons_room_id ON public.seasons(room_id);
CREATE INDEX idx_seasons_status ON public.seasons(status);
CREATE INDEX idx_seasons_dates ON public.seasons(start_date, end_date);

-- =====================================================
-- SUBMISSIONS
-- =====================================================

CREATE TYPE provider_type AS ENUM ('audius', 'soundcloud', 'youtube', 'upload');

CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  description TEXT,

  -- Media source
  media_type media_type NOT NULL,
  provider provider_type NOT NULL,
  external_id TEXT, -- Provider's ID (e.g., Audius track ID)
  external_url TEXT, -- Direct link to provider

  -- File storage (for uploads)
  storage_path TEXT, -- Path in Supabase Storage
  thumbnail_path TEXT,

  -- Metadata
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  width INTEGER,
  height INTEGER,

  -- Artist info (for music)
  artist_name TEXT,
  artist_handle TEXT,

  -- Engagement (denormalized for performance)
  boost_count INTEGER DEFAULT 0,
  weighted_boost_count NUMERIC(10,2) DEFAULT 0, -- With decay/velocity weighting
  play_count INTEGER DEFAULT 0,
  unique_boosters INTEGER DEFAULT 0,

  -- Velocity metrics
  boost_velocity NUMERIC(10,2) DEFAULT 0, -- Boosts per minute
  last_velocity_update TIMESTAMPTZ DEFAULT NOW(),

  -- Trending flags
  is_trending BOOLEAN DEFAULT FALSE,
  trending_score NUMERIC(10,2) DEFAULT 0,

  -- Moderation
  is_visible BOOLEAN DEFAULT TRUE,
  is_approved BOOLEAN DEFAULT TRUE,
  moderation_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_season_submission UNIQUE(season_id, user_id, external_id)
);

-- Indexes for performance
CREATE INDEX idx_submissions_season_id ON public.submissions(season_id);
CREATE INDEX idx_submissions_room_id ON public.submissions(room_id);
CREATE INDEX idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX idx_submissions_boost_count ON public.submissions(boost_count DESC);
CREATE INDEX idx_submissions_weighted_boost ON public.submissions(weighted_boost_count DESC);
CREATE INDEX idx_submissions_trending ON public.submissions(trending_score DESC) WHERE is_trending = TRUE;
CREATE INDEX idx_submissions_created_at ON public.submissions(created_at DESC);

-- =====================================================
-- BOOSTS (Voting/Engagement Events)
-- =====================================================

CREATE TABLE public.boosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,

  -- Boost weight (can vary based on user reputation, time of boost, etc.)
  weight NUMERIC(10,2) DEFAULT 1.0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_submission_boost UNIQUE(submission_id, user_id)
);

CREATE INDEX idx_boosts_submission_id ON public.boosts(submission_id);
CREATE INDEX idx_boosts_user_id ON public.boosts(user_id);
CREATE INDEX idx_boosts_season_id ON public.boosts(season_id);
CREATE INDEX idx_boosts_created_at ON public.boosts(created_at DESC);

-- =====================================================
-- PLAYLISTS
-- =====================================================

CREATE TABLE public.playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,

  -- Curation
  curated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_featured BOOLEAN DEFAULT FALSE,

  -- Stats
  track_count INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_playlists_room_id ON public.playlists(room_id);

-- =====================================================
-- PLAYLIST TRACKS (Many-to-Many with ordering)
-- =====================================================

CREATE TABLE public.playlist_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,

  -- Ordering
  position INTEGER NOT NULL,

  -- Track which season this came from
  season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL,

  added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_playlist_submission UNIQUE(playlist_id, submission_id)
);

CREATE INDEX idx_playlist_tracks_playlist_id ON public.playlist_tracks(playlist_id, position);
CREATE INDEX idx_playlist_tracks_submission_id ON public.playlist_tracks(submission_id);

-- Add FK for featured submission now that submissions table exists
ALTER TABLE public.rooms
ADD CONSTRAINT fk_featured_submission
FOREIGN KEY (featured_submission_id)
REFERENCES public.submissions(id) ON DELETE SET NULL;

-- =====================================================
-- USER SCORES (Detailed scoring per user/room)
-- =====================================================

CREATE TABLE public.user_room_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,

  -- Boost activity
  total_boosts INTEGER DEFAULT 0,
  season_boosts INTEGER DEFAULT 0, -- Boosts in active seasons

  -- Curator metrics
  curator_hits INTEGER DEFAULT 0, -- Boosts that became playlist tracks
  curator_misses INTEGER DEFAULT 0, -- Boosts that didn't make playlists
  curator_accuracy NUMERIC(5,2) DEFAULT 0, -- Percentage
  early_boost_count INTEGER DEFAULT 0, -- First N boosters of playlist tracks

  -- Points breakdown
  community_points INTEGER DEFAULT 0,
  curator_points INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,

  -- Participation
  seasons_participated INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  is_top_supporter BOOLEAN DEFAULT FALSE,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_room UNIQUE(user_id, room_id)
);

CREATE INDEX idx_user_room_scores_user_id ON public.user_room_scores(user_id);
CREATE INDEX idx_user_room_scores_room_id ON public.user_room_scores(room_id, total_points DESC);
CREATE INDEX idx_user_room_scores_total_points ON public.user_room_scores(total_points DESC);

-- =====================================================
-- BOOST HISTORY (For decay calculations and curator points)
-- =====================================================

CREATE TABLE public.boost_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,

  boost_count INTEGER DEFAULT 1,
  first_boost_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_boost_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Points awarded
  community_points_earned INTEGER DEFAULT 0,
  curator_points_earned INTEGER DEFAULT 0,

  -- Curator tracking
  made_playlist BOOLEAN DEFAULT FALSE,
  was_early_booster BOOLEAN DEFAULT FALSE, -- Top N% of boosters

  CONSTRAINT unique_user_submission_history UNIQUE(user_id, submission_id)
);

CREATE INDEX idx_boost_history_user_id ON public.boost_history(user_id);
CREATE INDEX idx_boost_history_submission_id ON public.boost_history(submission_id);

-- =====================================================
-- DAILY POINTS TRACKING (For 7-day history graphs)
-- =====================================================

CREATE TABLE public.daily_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  community_points INTEGER DEFAULT 0,
  curator_points INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,

  boosts_given INTEGER DEFAULT 0,

  CONSTRAINT unique_user_date UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_points_user_date ON public.daily_points(user_id, date DESC);

-- =====================================================
-- PLAY EVENTS (For analytics)
-- =====================================================

CREATE TABLE public.play_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Completion tracking
  duration_played_seconds INTEGER,
  completed BOOLEAN DEFAULT FALSE,

  -- Context
  played_from TEXT, -- 'season', 'playlist', 'featured', etc.

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_play_events_submission_id ON public.play_events(submission_id);
CREATE INDEX idx_play_events_user_id ON public.play_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_play_events_created_at ON public.play_events(created_at DESC);

-- =====================================================
-- ROOM MEMBERSHIPS (Track who follows/joins rooms)
-- =====================================================

CREATE TABLE public.room_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,

  is_moderator BOOLEAN DEFAULT FALSE,
  receive_notifications BOOLEAN DEFAULT TRUE,

  joined_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_room_membership UNIQUE(user_id, room_id)
);

CREATE INDEX idx_room_memberships_user_id ON public.room_memberships(user_id);
CREATE INDEX idx_room_memberships_room_id ON public.room_memberships(room_id);

-- =====================================================
-- ADMIN ACTIVITY LOG
-- =====================================================

CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT, -- 'room', 'season', 'submission', 'user'
  entity_id UUID,
  details JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX idx_admin_logs_created_at ON public.admin_logs(created_at DESC);
CREATE INDEX idx_admin_logs_entity ON public.admin_logs(entity_type, entity_id);
