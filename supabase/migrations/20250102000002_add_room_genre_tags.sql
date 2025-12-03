-- Add genre and tags fields to rooms table
-- Genre will be used for all Audius uploads in this room
-- Tags will be applied to all submissions in this room

ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS genre TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN public.rooms.genre IS 'Primary genre for the room (used for Audius uploads). Must match Audius SDK Genre enum.';
COMMENT ON COLUMN public.rooms.tags IS 'Default tags applied to all submissions in this room';

-- Update Phonk Monsta room with genre and tags
UPDATE public.rooms
SET
  genre = 'Electronic',
  tags = ARRAY['phonk', 'bass', 'trap']
WHERE slug = 'phonk-monsta';
