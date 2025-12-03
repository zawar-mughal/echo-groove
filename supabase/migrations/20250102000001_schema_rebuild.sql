-- =====================================================
-- SCHEMA REBUILD MIGRATION
-- =====================================================
-- This migration enhances the schema based on clarified requirements:
-- 1. Fix column naming (external_id → provider_track_id)
-- 2. Create room_admins join table for proper admin relationships
-- 3. Ensure Audius account is required for submissions (already enforced by trigger)
-- 4. Clean up and optimize schema structure

-- =====================================================
-- PART 1: FIX COLUMN NAMING
-- =====================================================

-- Rename external_id to provider_track_id for clarity
ALTER TABLE public.submissions
RENAME COLUMN external_id TO provider_track_id;

-- Update the unique constraint that was added in the Audius migration
-- First, drop the existing index that references provider_track_id
DROP INDEX IF EXISTS idx_unique_audius_track_per_room;

-- Recreate it with the correct column name
CREATE UNIQUE INDEX idx_unique_audius_track_per_room
ON public.submissions(room_id, provider_track_id)
WHERE is_visible = true AND provider = 'audius';

-- Update the index for provider_track_id lookups
DROP INDEX IF EXISTS idx_submissions_provider_track_id;

CREATE INDEX idx_submissions_provider_track_id
ON public.submissions(provider_track_id)
WHERE provider = 'audius';

-- =====================================================
-- PART 2: CREATE ROOM_ADMINS JOIN TABLE
-- =====================================================

-- Create the room_admins table for explicit admin relationships
CREATE TABLE IF NOT EXISTS public.room_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Permissions
  can_manage_seasons BOOLEAN DEFAULT TRUE,
  can_manage_submissions BOOLEAN DEFAULT TRUE,
  can_manage_settings BOOLEAN DEFAULT TRUE,

  -- Audit trail
  added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_room_admin UNIQUE(room_id, user_id)
);

-- Create indexes for efficient lookups
CREATE INDEX idx_room_admins_room_id ON public.room_admins(room_id);
CREATE INDEX idx_room_admins_user_id ON public.room_admins(user_id);

-- =====================================================
-- PART 3: MIGRATE EXISTING MODERATOR_IDS TO ROOM_ADMINS
-- =====================================================

-- Insert existing moderators from rooms.moderator_ids array into room_admins table
-- This uses PostgreSQL's unnest function to expand the array
INSERT INTO public.room_admins (room_id, user_id, added_by)
SELECT
  r.id as room_id,
  unnest(r.moderator_ids) as user_id,
  r.created_by as added_by
FROM public.rooms r
WHERE r.moderator_ids IS NOT NULL
  AND array_length(r.moderator_ids, 1) > 0
ON CONFLICT (room_id, user_id) DO NOTHING;

-- Also ensure room creators are admins of their rooms
INSERT INTO public.room_admins (room_id, user_id, added_by)
SELECT
  r.id as room_id,
  r.created_by as user_id,
  r.created_by as added_by
FROM public.rooms r
WHERE r.created_by IS NOT NULL
ON CONFLICT (room_id, user_id) DO NOTHING;

-- Keep moderator_ids column for now (for backwards compatibility)
-- Can be removed in a future migration after verifying everything works
-- ALTER TABLE public.rooms DROP COLUMN moderator_ids;

-- =====================================================
-- PART 4: HELPER FUNCTIONS FOR ADMIN CHECKS
-- =====================================================

-- Function to check if a user is an admin of a room
CREATE OR REPLACE FUNCTION is_room_admin(p_user_id UUID, p_room_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.room_admins
    WHERE user_id = p_user_id
      AND room_id = p_room_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user can manage seasons for a room
CREATE OR REPLACE FUNCTION can_manage_seasons(p_user_id UUID, p_room_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Platform admins can manage any room
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND is_admin = TRUE) THEN
    RETURN TRUE;
  END IF;

  -- Room admins with season management permission
  RETURN EXISTS (
    SELECT 1
    FROM public.room_admins
    WHERE user_id = p_user_id
      AND room_id = p_room_id
      AND can_manage_seasons = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 5: UPDATE RLS POLICIES FOR ROOM_ADMINS
-- =====================================================

-- Enable RLS on room_admins table
ALTER TABLE public.room_admins ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view room admins (public information)
CREATE POLICY "Room admins are viewable by everyone"
ON public.room_admins
FOR SELECT
USING (true);

-- Only platform admins and room creators can add new room admins
CREATE POLICY "Platform admins and room creators can add room admins"
ON public.room_admins
FOR INSERT
WITH CHECK (
  -- Must be platform admin
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  )
  OR
  -- Or must be the room creator
  EXISTS (
    SELECT 1 FROM public.rooms
    WHERE id = room_id AND created_by = auth.uid()
  )
  OR
  -- Or must be an existing room admin
  EXISTS (
    SELECT 1 FROM public.room_admins
    WHERE room_id = room_admins.room_id AND user_id = auth.uid()
  )
);

-- Only platform admins and room admins can modify admin permissions
CREATE POLICY "Platform admins and room admins can update permissions"
ON public.room_admins
FOR UPDATE
USING (
  -- Must be platform admin
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  )
  OR
  -- Or must be an admin of this room
  EXISTS (
    SELECT 1 FROM public.room_admins
    WHERE room_id = room_admins.room_id AND user_id = auth.uid()
  )
);

-- Only platform admins can remove room admins
CREATE POLICY "Only platform admins can remove room admins"
ON public.room_admins
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- =====================================================
-- PART 6: UPDATE SEASONS RLS POLICIES
-- =====================================================

-- Drop existing season management policies if they exist
DROP POLICY IF EXISTS "Only admins can create seasons" ON public.seasons;
DROP POLICY IF EXISTS "Only admins can update seasons" ON public.seasons;

-- Create new policy: Room admins can create seasons for their rooms
CREATE POLICY "Room admins can create seasons"
ON public.seasons
FOR INSERT
WITH CHECK (
  -- Must be platform admin
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  )
  OR
  -- Or must be a room admin with season management permission
  can_manage_seasons(auth.uid(), room_id)
);

-- Create new policy: Room admins can update seasons for their rooms
CREATE POLICY "Room admins can update seasons"
ON public.seasons
FOR UPDATE
USING (
  -- Must be platform admin
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  )
  OR
  -- Or must be a room admin with season management permission
  can_manage_seasons(auth.uid(), room_id)
);

-- =====================================================
-- PART 7: ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.room_admins IS 'Junction table tracking which users are admins of which rooms';
COMMENT ON COLUMN public.room_admins.can_manage_seasons IS 'Permission to create, update, and end seasons';
COMMENT ON COLUMN public.room_admins.can_manage_submissions IS 'Permission to moderate and manage submissions';
COMMENT ON COLUMN public.room_admins.can_manage_settings IS 'Permission to update room settings';

COMMENT ON FUNCTION is_room_admin(UUID, UUID) IS 'Check if a user is an admin of a specific room';
COMMENT ON FUNCTION can_manage_seasons(UUID, UUID) IS 'Check if a user can manage seasons for a specific room';

COMMENT ON COLUMN public.submissions.provider_track_id IS 'The track ID from the provider (e.g., Audius track ID)';

-- =====================================================
-- PART 8: GRANT PERMISSIONS
-- =====================================================

-- Grant access to room_admins table
GRANT SELECT ON public.room_admins TO authenticated;
GRANT SELECT ON public.room_admins TO anon;
GRANT INSERT, UPDATE, DELETE ON public.room_admins TO authenticated;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION is_room_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_room_admin(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION can_manage_seasons(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_manage_seasons(UUID, UUID) TO anon;
