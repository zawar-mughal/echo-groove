-- =====================================================
-- MAKE USER ADMIN
-- =====================================================
-- This script makes a user an admin of the platform
-- and adds them as a moderator of the Phonk Monsta room

-- =====================================================
-- INSTRUCTIONS
-- =====================================================
-- 1. Replace 'USER_EMAIL_HERE' with the actual user's email
-- 2. Run this script in Supabase SQL Editor
-- 3. The user will be granted admin privileges

-- =====================================================
-- 1. SET USER AS ADMIN IN PROFILES TABLE
-- =====================================================

-- Option A: By email (recommended)
UPDATE public.profiles
SET is_admin = true
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'USER_EMAIL_HERE'
);

-- Option B: By user ID (if you know the UUID)
-- UPDATE public.profiles
-- SET is_admin = true
-- WHERE user_id = 'USER_UUID_HERE';

-- =====================================================
-- 2. ADD USER AS MODERATOR OF PHONK MONSTA ROOM
-- =====================================================

WITH user_profile AS (
  SELECT id, user_id FROM public.profiles
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'USER_EMAIL_HERE'
  )
  LIMIT 1
),
phonk_room AS (
  SELECT id FROM public.rooms WHERE slug = 'phonk-monsta' LIMIT 1
)
UPDATE public.rooms
SET
  moderator_ids = ARRAY[user_profile.user_id],
  created_by = user_profile.user_id
FROM user_profile, phonk_room
WHERE rooms.id = phonk_room.id;

-- =====================================================
-- 3. VERIFY ADMIN STATUS
-- =====================================================

-- Check the user's admin status
SELECT
  p.id,
  p.username,
  p.is_admin,
  u.email,
  p.audius_id,
  p.audius_handle
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'USER_EMAIL_HERE';

-- Check room moderators
SELECT
  r.title as room_title,
  r.slug,
  r.moderator_ids,
  r.created_by
FROM public.rooms r
WHERE r.slug = 'phonk-monsta';

-- =====================================================
-- SUCCESS!
-- =====================================================
-- The user is now an admin and can access the admin panel
-- They are also a moderator of the Phonk Monsta room


-- =====================================================
-- ALTERNATIVE: MAKE ALL USERS ADMINS (TESTING ONLY)
-- =====================================================
-- Uncomment to make ALL existing users admins (useful for testing)

-- UPDATE public.profiles
-- SET is_admin = true;
