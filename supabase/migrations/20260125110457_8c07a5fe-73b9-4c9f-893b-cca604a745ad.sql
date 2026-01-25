-- Drop the foreign key constraint on session_id since invites are created before sessions
-- The session is created when connecting to LiveKit, but invites are created before that
ALTER TABLE public.livekit_session_invites DROP CONSTRAINT IF EXISTS livekit_session_invites_session_id_fkey;

-- Make session_id nullable since it may not exist when invite is created
ALTER TABLE public.livekit_session_invites ALTER COLUMN session_id DROP NOT NULL;