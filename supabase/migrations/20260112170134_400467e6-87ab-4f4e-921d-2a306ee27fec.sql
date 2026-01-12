-- Add is_system_room flag to identify platform-created default rooms (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_rooms' AND column_name = 'is_system_room') THEN
    ALTER TABLE public.study_rooms ADD COLUMN is_system_room BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_rooms' AND column_name = 'is_always_muted') THEN
    ALTER TABLE public.study_rooms ADD COLUMN is_always_muted BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Get the system profile id (LiqLearns)
-- Create default 18+ public room using existing system profile
INSERT INTO public.study_rooms (
  id, name, description, room_type, host_id, study_topic, 
  education_level, max_participants, is_active, is_system_room, is_always_muted
) VALUES (
  '00000000-0000-0000-0000-000000000010',
  'LiqLearns Public Lounge',
  'The official public study room for all learners 18+. Focus, study, and grow together!',
  'public',
  '00000000-0000-0000-0000-000000000001',
  'General Study',
  'All Levels',
  500,
  true,
  true,
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_system_room = true,
  is_always_muted = true;

-- Create default Under 18 room
INSERT INTO public.study_rooms (
  id, name, description, room_type, host_id, study_topic,
  education_level, max_participants, is_active, is_system_room, is_always_muted
) VALUES (
  '00000000-0000-0000-0000-000000000011',
  'LiqLearns Kids Zone',
  'The official safe study room for students under 18. Moderated and secure!',
  'kids',
  '00000000-0000-0000-0000-000000000001',
  'General Study',
  'K-12',
  500,
  true,
  true,
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_system_room = true,
  is_always_muted = true;

-- Add index for system rooms
CREATE INDEX IF NOT EXISTS idx_study_rooms_system ON public.study_rooms(is_system_room) WHERE is_system_room = true;