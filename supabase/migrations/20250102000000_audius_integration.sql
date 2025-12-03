-- =====================================================
-- AUDIUS INTEGRATION MIGRATION
-- =====================================================
-- This migration enforces Audius as the exclusive music provider
-- and adds necessary constraints and indexes

-- =====================================================
-- 1. UPDATE PROFILES TABLE
-- =====================================================

-- Add index for faster Audius ID lookups
CREATE INDEX IF NOT EXISTS idx_profiles_audius_id
ON public.profiles(audius_id)
WHERE audius_id IS NOT NULL;

-- Add constraint to ensure audius_id format (alphanumeric)
ALTER TABLE public.profiles
ADD CONSTRAINT audius_id_format
CHECK (audius_id ~ '^[a-zA-Z0-9]+$');

-- =====================================================
-- 2. UPDATE SUBMISSIONS TABLE
-- =====================================================

-- Add unique constraint: prevent duplicate Audius track per room
-- This prevents users from submitting the same track multiple times
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_audius_track_per_room
ON public.submissions(room_id, provider_track_id)
WHERE is_visible = true AND provider_type = 'audius';

-- Add index for provider_track_id (Audius track ID) for faster lookups
CREATE INDEX IF NOT EXISTS idx_submissions_provider_track_id
ON public.submissions(provider_track_id)
WHERE provider_type = 'audius';

-- Add constraint: require provider_track_id for Audius submissions
-- (This will be enforced in application logic for now to avoid breaking existing data)

-- =====================================================
-- 3. CREATE HELPER FUNCTION
-- =====================================================

-- Function to check if user has Audius linked before submission
CREATE OR REPLACE FUNCTION check_audius_linked_for_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check for new Audius submissions
  IF NEW.provider_type = 'audius' THEN
    -- Check if user has Audius account linked
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = NEW.user_id
      AND audius_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'User must link Audius account before submitting tracks';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CREATE TRIGGER
-- =====================================================

-- Trigger to enforce Audius linking before submission
DROP TRIGGER IF EXISTS enforce_audius_link_on_submission ON public.submissions;

CREATE TRIGGER enforce_audius_link_on_submission
BEFORE INSERT ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION check_audius_linked_for_submission();

-- =====================================================
-- 5. ADD HELPER VIEWS (OPTIONAL)
-- =====================================================

-- View for submissions with Audius user info
CREATE OR REPLACE VIEW public.audius_submissions AS
SELECT
  s.*,
  p.audius_id,
  p.audius_handle,
  p.username as echo_username
FROM public.submissions s
JOIN public.profiles p ON s.user_id = p.id
WHERE s.provider_type = 'audius' AND s.is_visible = true;

-- =====================================================
-- 6. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON INDEX idx_profiles_audius_id IS 'Index for fast Audius ID lookups';
COMMENT ON INDEX idx_unique_audius_track_per_room IS 'Prevents duplicate Audius tracks in the same room';
COMMENT ON INDEX idx_submissions_provider_track_id IS 'Index for Audius track ID lookups';
COMMENT ON FUNCTION check_audius_linked_for_submission() IS 'Validates user has Audius account linked before allowing submissions';
COMMENT ON VIEW audius_submissions IS 'Convenient view for submissions with Audius user information';

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant access to the view for authenticated users
GRANT SELECT ON public.audius_submissions TO authenticated;
GRANT SELECT ON public.audius_submissions TO anon;
