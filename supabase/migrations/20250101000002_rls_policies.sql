-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_room_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boost_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES
-- =====================================================

-- Anyone can view public profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (via trigger from auth.users)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- ROOMS
-- =====================================================

-- Public rooms viewable by everyone
CREATE POLICY "Public rooms are viewable by everyone"
  ON public.rooms FOR SELECT
  USING (is_public = true OR auth.uid() = created_by);

-- Authenticated users can create rooms
CREATE POLICY "Authenticated users can create rooms"
  ON public.rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Room creators and moderators can update rooms
CREATE POLICY "Room creators and moderators can update"
  ON public.rooms FOR UPDATE
  USING (
    auth.uid() = created_by
    OR auth.uid() = ANY(moderator_ids)
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can delete rooms
CREATE POLICY "Admins can delete rooms"
  ON public.rooms FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- =====================================================
-- SEASONS
-- =====================================================

-- Everyone can view seasons
CREATE POLICY "Seasons are viewable by everyone"
  ON public.seasons FOR SELECT
  USING (true);

-- Room creators and moderators can create seasons
CREATE POLICY "Room creators and moderators can create seasons"
  ON public.seasons FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE id = room_id
        AND (
          created_by = auth.uid()
          OR auth.uid() = ANY(moderator_ids)
          OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND is_admin = true
          )
        )
    )
  );

-- Room creators and moderators can update seasons
CREATE POLICY "Room creators and moderators can update seasons"
  ON public.seasons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE id = room_id
        AND (
          created_by = auth.uid()
          OR auth.uid() = ANY(moderator_ids)
          OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND is_admin = true
          )
        )
    )
  );

-- Room creators and moderators can delete seasons
CREATE POLICY "Room creators and moderators can delete seasons"
  ON public.seasons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE id = room_id
        AND (
          created_by = auth.uid()
          OR auth.uid() = ANY(moderator_ids)
          OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND is_admin = true
          )
        )
    )
  );

-- =====================================================
-- SUBMISSIONS
-- =====================================================

-- Visible submissions viewable by everyone
CREATE POLICY "Visible submissions are viewable by everyone"
  ON public.submissions FOR SELECT
  USING (is_visible = true OR auth.uid() = user_id);

-- Authenticated users can create submissions
CREATE POLICY "Authenticated users can create submissions"
  ON public.submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.seasons
      WHERE id = season_id
        AND status IN ('active', 'voting')
        AND start_date <= NOW()
        AND (voting_end_date IS NULL OR voting_end_date >= NOW())
    )
  );

-- Users can update their own submissions
CREATE POLICY "Users can update own submissions"
  ON public.submissions FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Users can delete their own submissions
CREATE POLICY "Users can delete own submissions"
  ON public.submissions FOR DELETE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  ));

-- =====================================================
-- BOOSTS
-- =====================================================

-- Users can view their own boosts
CREATE POLICY "Users can view own boosts"
  ON public.boosts FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can create boosts
CREATE POLICY "Authenticated users can create boosts"
  ON public.boosts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.seasons se ON se.id = s.season_id
      WHERE s.id = submission_id
        AND s.is_visible = true
        AND se.status IN ('active', 'voting')
    )
  );

-- Users can delete their own boosts (un-boost)
CREATE POLICY "Users can delete own boosts"
  ON public.boosts FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- PLAYLISTS
-- =====================================================

-- Everyone can view playlists
CREATE POLICY "Playlists are viewable by everyone"
  ON public.playlists FOR SELECT
  USING (true);

-- Room creators and moderators can create playlists
CREATE POLICY "Room creators and moderators can create playlists"
  ON public.playlists FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE id = room_id
        AND (
          created_by = auth.uid()
          OR auth.uid() = ANY(moderator_ids)
          OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND is_admin = true
          )
        )
    )
  );

-- Room creators and moderators can update playlists
CREATE POLICY "Room creators and moderators can update playlists"
  ON public.playlists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE id = room_id
        AND (
          created_by = auth.uid()
          OR auth.uid() = ANY(moderator_ids)
          OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND is_admin = true
          )
        )
    )
  );

-- =====================================================
-- PLAYLIST TRACKS
-- =====================================================

-- Everyone can view playlist tracks
CREATE POLICY "Playlist tracks are viewable by everyone"
  ON public.playlist_tracks FOR SELECT
  USING (true);

-- Room moderators can add tracks to playlists
CREATE POLICY "Room moderators can add playlist tracks"
  ON public.playlist_tracks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists p
      JOIN public.rooms r ON r.id = p.room_id
      WHERE p.id = playlist_id
        AND (
          r.created_by = auth.uid()
          OR auth.uid() = ANY(r.moderator_ids)
          OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND is_admin = true
          )
        )
    )
  );

-- Room moderators can remove tracks from playlists
CREATE POLICY "Room moderators can remove playlist tracks"
  ON public.playlist_tracks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      JOIN public.rooms r ON r.id = p.room_id
      WHERE p.id = playlist_id
        AND (
          r.created_by = auth.uid()
          OR auth.uid() = ANY(r.moderator_ids)
          OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND is_admin = true
          )
        )
    )
  );

-- =====================================================
-- USER ROOM SCORES
-- =====================================================

-- Users can view all scores (for leaderboards)
CREATE POLICY "Scores are viewable by everyone"
  ON public.user_room_scores FOR SELECT
  USING (true);

-- System can insert/update scores (managed by triggers)
CREATE POLICY "System can manage scores"
  ON public.user_room_scores FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- BOOST HISTORY
-- =====================================================

-- Users can view their own boost history
CREATE POLICY "Users can view own boost history"
  ON public.boost_history FOR SELECT
  USING (auth.uid() = user_id);

-- System can manage boost history (triggers)
CREATE POLICY "System can manage boost history"
  ON public.boost_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- DAILY POINTS
-- =====================================================

-- Users can view their own daily points
CREATE POLICY "Users can view own daily points"
  ON public.daily_points FOR SELECT
  USING (auth.uid() = user_id);

-- System can manage daily points
CREATE POLICY "System can manage daily points"
  ON public.daily_points FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- PLAY EVENTS
-- =====================================================

-- Authenticated users can create play events
CREATE POLICY "Authenticated users can create play events"
  ON public.play_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Anonymous users can create play events
CREATE POLICY "Anonymous users can create play events"
  ON public.play_events FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Users can view their own play events
CREATE POLICY "Users can view own play events"
  ON public.play_events FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- =====================================================
-- ROOM MEMBERSHIPS
-- =====================================================

-- Users can view room memberships
CREATE POLICY "Room memberships are viewable"
  ON public.room_memberships FOR SELECT
  USING (true);

-- Users can join rooms
CREATE POLICY "Users can join rooms"
  ON public.room_memberships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can leave rooms
CREATE POLICY "Users can leave rooms"
  ON public.room_memberships FOR DELETE
  USING (auth.uid() = user_id);

-- Users can update their membership settings
CREATE POLICY "Users can update own membership"
  ON public.room_memberships FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- ADMIN LOGS
-- =====================================================

-- Admins can view all logs
CREATE POLICY "Admins can view logs"
  ON public.admin_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- System can insert logs
CREATE POLICY "System can insert logs"
  ON public.admin_logs FOR INSERT
  WITH CHECK (true);
