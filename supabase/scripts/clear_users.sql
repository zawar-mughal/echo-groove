-- =====================================================
-- CLEAR ALL USERS FROM DATABASE
-- =====================================================
-- ⚠️  WARNING: This script will DELETE all user data!
-- Use this ONLY for testing/development to reset the database
-- DO NOT run this in production!

-- This script will:
-- 1. Delete all user-related data (boosts, submissions, etc.)
-- 2. Delete all profiles
-- 3. Clean up auth.users table

-- =====================================================
-- SAFETY CHECK
-- =====================================================
-- Before running, make sure you understand this will delete ALL USERS
-- and ALL their associated data (submissions, boosts, etc.)

-- Uncomment the line below to proceed:
-- DO $$ BEGIN RAISE NOTICE 'Starting user cleanup...'; END $$;

-- =====================================================
-- 1. DELETE USER-RELATED DATA
-- =====================================================

-- Delete all boosts (must be first due to foreign keys)
DELETE FROM public.boosts;

-- Delete all submissions
DELETE FROM public.submissions;

-- Delete all playlist tracks (if any exist)
-- DELETE FROM public.playlist_tracks WHERE user_id IS NOT NULL;

-- =====================================================
-- 2. DELETE PROFILES
-- =====================================================

-- Delete all user profiles
DELETE FROM public.profiles;

-- =====================================================
-- 3. DELETE AUTH USERS
-- =====================================================
-- This requires admin privileges
-- You may need to run this from Supabase Dashboard → Authentication → Users
-- Or use the Supabase CLI with admin access

-- For Supabase Dashboard:
-- 1. Go to Authentication → Users
-- 2. Select all users
-- 3. Click "Delete users"

-- For SQL (if you have admin access):
-- DELETE FROM auth.users;

-- =====================================================
-- 4. RESET SEQUENCES (OPTIONAL)
-- =====================================================
-- Uncomment these to reset auto-increment IDs back to 1
-- This is useful if you want clean IDs after clearing data

-- ALTER SEQUENCE IF EXISTS public.profiles_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS public.submissions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS public.boosts_id_seq RESTART WITH 1;

-- =====================================================
-- 5. VERIFY DELETION
-- =====================================================

-- Check that all user data is gone
SELECT 'Remaining profiles:' as check_type, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'Remaining submissions:', COUNT(*) FROM public.submissions
UNION ALL
SELECT 'Remaining boosts:', COUNT(*) FROM public.boosts;

-- =====================================================
-- SUCCESS!
-- =====================================================
-- All user data has been cleared
-- You can now sign up for a new account to test
-- Remember to make that account an admin using the make_user_admin.sql script
