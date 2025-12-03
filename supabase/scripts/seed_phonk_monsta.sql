-- =====================================================
-- SEED PHONK MONSTA ROOM
-- =====================================================
-- This script creates the "Phonk Monsta" room with an active season
-- Run this in Supabase SQL Editor to set up the test room

-- =====================================================
-- 1. CREATE PHONK MONSTA ROOM
-- =====================================================

INSERT INTO public.rooms (
  title,
  slug,
  description,
  is_active,
  is_public,
  allow_submissions
) VALUES (
  'Phonk Monsta',
  'phonk-monsta',
  'The ultimate battleground for phonk music producers. Submit your hardest beats and compete for the crown!',
  true,
  true,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  is_public = EXCLUDED.is_public,
  allow_submissions = EXCLUDED.allow_submissions
RETURNING id;

-- =====================================================
-- 2. CREATE ACTIVE SEASON FOR PHONK MONSTA
-- =====================================================
-- Note: You'll need to update the room_id if the INSERT above creates a new room
-- Or run this as a separate query after getting the room ID

WITH phonk_room AS (
  SELECT id FROM public.rooms WHERE slug = 'phonk-monsta' LIMIT 1
)
INSERT INTO public.seasons (
  room_id,
  title,
  start_date,
  end_date,
  status,
  media_type,
  max_submissions_per_user,
  boost_multiplier
)
SELECT
  phonk_room.id,
  'Season 1: The Awakening',
  NOW(),
  NOW() + INTERVAL '30 days',
  'active',
  'audio',
  3,
  1.0
FROM phonk_room
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. VERIFY CREATION
-- =====================================================

-- Check the room was created
SELECT
  id,
  title,
  slug,
  description,
  is_active,
  is_public,
  allow_submissions,
  created_at
FROM public.rooms
WHERE slug = 'phonk-monsta';

-- Check the season was created
SELECT
  s.id,
  s.title,
  s.status,
  s.start_date,
  s.end_date,
  s.max_submissions_per_user,
  s.boost_multiplier,
  r.title as room_title
FROM public.seasons s
JOIN public.rooms r ON s.room_id = r.id
WHERE r.slug = 'phonk-monsta'
ORDER BY s.created_at DESC;

-- =====================================================
-- SUCCESS!
-- =====================================================
-- The Phonk Monsta room is now ready with an active season
-- Users can start submitting tracks!
