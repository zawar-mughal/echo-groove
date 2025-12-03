-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON public.seasons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON public.playlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_room_scores_updated_at BEFORE UPDATE ON public.user_room_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- BOOST MANAGEMENT
-- =====================================================

-- Function to handle boost creation and update counts
CREATE OR REPLACE FUNCTION handle_new_boost()
RETURNS TRIGGER AS $$
DECLARE
  v_submission_created_at TIMESTAMPTZ;
  v_time_since_creation INTERVAL;
  v_boost_weight NUMERIC(10,2);
BEGIN
  -- Get submission creation time
  SELECT created_at INTO v_submission_created_at
  FROM public.submissions
  WHERE id = NEW.submission_id;

  -- Calculate time-based weight (newer submissions get slight boost)
  v_time_since_creation := NOW() - v_submission_created_at;
  v_boost_weight := CASE
    WHEN v_time_since_creation < INTERVAL '5 minutes' THEN 1.2
    WHEN v_time_since_creation < INTERVAL '15 minutes' THEN 1.1
    ELSE 1.0
  END;

  NEW.weight := v_boost_weight;

  -- Update submission boost counts
  UPDATE public.submissions
  SET
    boost_count = boost_count + 1,
    weighted_boost_count = weighted_boost_count + v_boost_weight,
    unique_boosters = (
      SELECT COUNT(DISTINCT user_id)
      FROM public.boosts
      WHERE submission_id = NEW.submission_id
    ) + 1
  WHERE id = NEW.submission_id;

  -- Update season stats
  UPDATE public.seasons
  SET total_boosts = total_boosts + 1
  WHERE id = NEW.season_id;

  -- Update user profile stats
  UPDATE public.profiles
  SET
    total_boosts = total_boosts + 1,
    daily_boost_count = CASE
      WHEN last_boost_date = CURRENT_DATE THEN daily_boost_count + 1
      ELSE 1
    END,
    last_boost_date = CURRENT_DATE
  WHERE id = NEW.user_id;

  -- Update or insert boost history
  INSERT INTO public.boost_history (user_id, submission_id, boost_count, first_boost_at, last_boost_at)
  VALUES (NEW.user_id, NEW.submission_id, 1, NOW(), NOW())
  ON CONFLICT (user_id, submission_id)
  DO UPDATE SET
    boost_count = boost_history.boost_count + 1,
    last_boost_at = NOW();

  -- Update user room scores
  INSERT INTO public.user_room_scores (user_id, room_id, total_boosts, season_boosts)
  SELECT NEW.user_id, s.room_id, 1, 1
  FROM public.submissions s
  WHERE s.id = NEW.submission_id
  ON CONFLICT (user_id, room_id)
  DO UPDATE SET
    total_boosts = user_room_scores.total_boosts + 1,
    season_boosts = user_room_scores.season_boosts + 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_boost_created
  BEFORE INSERT ON public.boosts
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_boost();

-- =====================================================
-- BOOST REMOVAL (UN-BOOST)
-- =====================================================

CREATE OR REPLACE FUNCTION handle_boost_removal()
RETURNS TRIGGER AS $$
BEGIN
  -- Update submission counts
  UPDATE public.submissions
  SET
    boost_count = GREATEST(0, boost_count - 1),
    weighted_boost_count = GREATEST(0, weighted_boost_count - OLD.weight),
    unique_boosters = (
      SELECT COUNT(DISTINCT user_id)
      FROM public.boosts
      WHERE submission_id = OLD.submission_id
    )
  WHERE id = OLD.submission_id;

  -- Update season stats
  UPDATE public.seasons
  SET total_boosts = GREATEST(0, total_boosts - 1)
  WHERE id = OLD.season_id;

  -- Update user profile stats
  UPDATE public.profiles
  SET total_boosts = GREATEST(0, total_boosts - 1)
  WHERE id = OLD.user_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_boost_removed
  AFTER DELETE ON public.boosts
  FOR EACH ROW
  EXECUTE FUNCTION handle_boost_removal();

-- =====================================================
-- VELOCITY CALCULATION
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_boost_velocity(p_submission_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_velocity NUMERIC(10,2);
  v_time_window INTERVAL := INTERVAL '15 minutes';
BEGIN
  SELECT COUNT(*)::NUMERIC / EXTRACT(EPOCH FROM v_time_window) * 60
  INTO v_velocity
  FROM public.boosts
  WHERE submission_id = p_submission_id
    AND created_at >= NOW() - v_time_window;

  RETURN COALESCE(v_velocity, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update trending status
CREATE OR REPLACE FUNCTION update_trending_submissions()
RETURNS void AS $$
BEGIN
  -- Reset all trending flags
  UPDATE public.submissions SET is_trending = FALSE;

  -- Mark top velocity submissions as trending
  WITH trending_calc AS (
    SELECT
      id,
      boost_velocity,
      weighted_boost_count,
      (boost_velocity * 10 + weighted_boost_count * 0.5) AS trending_score
    FROM public.submissions
    WHERE
      created_at >= NOW() - INTERVAL '2 hours'
      AND is_visible = TRUE
  )
  UPDATE public.submissions s
  SET
    is_trending = TRUE,
    trending_score = tc.trending_score
  FROM trending_calc tc
  WHERE s.id = tc.id
    AND tc.trending_score > 5
  ORDER BY tc.trending_score DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SUBMISSION MANAGEMENT
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Update season submission count
  UPDATE public.seasons
  SET submission_count = submission_count + 1
  WHERE id = NEW.season_id;

  -- Update room submission count
  UPDATE public.rooms
  SET total_submissions = total_submissions + 1
  WHERE id = NEW.room_id;

  -- Update user submission count
  UPDATE public.profiles
  SET total_submissions = total_submissions + 1
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_submission_created
  AFTER INSERT ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_submission();

-- =====================================================
-- PLAYLIST MANAGEMENT
-- =====================================================

CREATE OR REPLACE FUNCTION handle_playlist_track_added()
RETURNS TRIGGER AS $$
BEGIN
  -- Update playlist track count and duration
  UPDATE public.playlists
  SET
    track_count = track_count + 1,
    total_duration_seconds = total_duration_seconds + COALESCE(
      (SELECT duration_seconds FROM public.submissions WHERE id = NEW.submission_id),
      0
    )
  WHERE id = NEW.playlist_id;

  -- Mark in boost history that this submission made it to playlist
  UPDATE public.boost_history
  SET made_playlist = TRUE
  WHERE submission_id = NEW.submission_id;

  -- Award curator points to users who boosted this submission
  -- Top 20% of boosters get bonus points
  WITH early_boosters AS (
    SELECT
      b.user_id,
      b.submission_id,
      ROW_NUMBER() OVER (PARTITION BY b.submission_id ORDER BY b.created_at) AS boost_rank,
      COUNT(*) OVER (PARTITION BY b.submission_id) AS total_boosters
    FROM public.boosts b
    WHERE b.submission_id = NEW.submission_id
  )
  UPDATE public.boost_history bh
  SET
    was_early_booster = (eb.boost_rank::NUMERIC / NULLIF(eb.total_boosters, 0) <= 0.2),
    curator_points_earned = CASE
      WHEN eb.boost_rank::NUMERIC / NULLIF(eb.total_boosters, 0) <= 0.2 THEN 50
      ELSE 25
    END
  FROM early_boosters eb
  WHERE bh.user_id = eb.user_id
    AND bh.submission_id = eb.submission_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_playlist_track_added
  AFTER INSERT ON public.playlist_tracks
  FOR EACH ROW
  EXECUTE FUNCTION handle_playlist_track_added();

-- =====================================================
-- CURATOR POINTS AGGREGATION
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_curator_stats(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Update user room scores for all rooms
  WITH curator_stats AS (
    SELECT
      s.room_id,
      COUNT(*) FILTER (WHERE bh.made_playlist = TRUE) AS hits,
      COUNT(*) FILTER (WHERE bh.made_playlist = FALSE) AS misses,
      SUM(bh.curator_points_earned) AS points,
      COUNT(*) FILTER (WHERE bh.was_early_booster = TRUE) AS early_boosts
    FROM public.boost_history bh
    JOIN public.submissions s ON s.id = bh.submission_id
    WHERE bh.user_id = p_user_id
    GROUP BY s.room_id
  )
  INSERT INTO public.user_room_scores (
    user_id, room_id, curator_hits, curator_misses,
    curator_accuracy, curator_points, early_boost_count
  )
  SELECT
    p_user_id,
    cs.room_id,
    cs.hits,
    cs.misses,
    CASE WHEN (cs.hits + cs.misses) > 0
      THEN (cs.hits::NUMERIC / (cs.hits + cs.misses) * 100)
      ELSE 0
    END,
    cs.points,
    cs.early_boosts
  FROM curator_stats cs
  ON CONFLICT (user_id, room_id)
  DO UPDATE SET
    curator_hits = EXCLUDED.curator_hits,
    curator_misses = EXCLUDED.curator_misses,
    curator_accuracy = EXCLUDED.curator_accuracy,
    curator_points = EXCLUDED.curator_points,
    early_boost_count = EXCLUDED.early_boost_count;

  -- Update profile curator points
  UPDATE public.profiles
  SET curator_points = (
    SELECT COALESCE(SUM(curator_points_earned), 0)
    FROM public.boost_history
    WHERE user_id = p_user_id
  )
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- DAILY RESET FUNCTION (Called by cron/scheduler)
-- =====================================================

CREATE OR REPLACE FUNCTION reset_daily_boost_counts()
RETURNS void AS $$
BEGIN
  -- Reset daily boost counts for all users
  UPDATE public.profiles
  SET daily_boost_count = 0
  WHERE last_boost_date < CURRENT_DATE;

  -- Update streaks
  UPDATE public.profiles
  SET
    current_streak = CASE
      WHEN last_boost_date = CURRENT_DATE - 1 THEN current_streak
      WHEN last_boost_date = CURRENT_DATE THEN current_streak
      ELSE 0
    END,
    longest_streak = GREATEST(longest_streak, current_streak)
  WHERE last_boost_date IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
