-- Fix the status check constraint to include all used values
ALTER TABLE public.livekit_session_invites 
DROP CONSTRAINT IF EXISTS livekit_session_invites_status_check;

ALTER TABLE public.livekit_session_invites 
ADD CONSTRAINT livekit_session_invites_status_check 
CHECK (status IN ('pending', 'accepted', 'declined', 'rejected', 'cancelled', 'expired', 'missed'));