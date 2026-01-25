-- Add call info columns to livekit_session_invites
ALTER TABLE public.livekit_session_invites 
ADD COLUMN IF NOT EXISTS call_type text DEFAULT 'voice',
ADD COLUMN IF NOT EXISTS room_name text,
ADD COLUMN IF NOT EXISTS inviter_name text,
ADD COLUMN IF NOT EXISTS inviter_avatar text,
ADD COLUMN IF NOT EXISTS context_type text DEFAULT 'dm',
ADD COLUMN IF NOT EXISTS context_id text;

-- Update RLS policies to allow users to see their own invites
DROP POLICY IF EXISTS "Users can see invites for them" ON public.livekit_session_invites;
CREATE POLICY "Users can see invites for them" 
ON public.livekit_session_invites 
FOR SELECT 
USING (
  invitee_id IN (SELECT user_id FROM profiles WHERE user_id = auth.uid())
  OR inviter_id IN (SELECT user_id FROM profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can create invites" ON public.livekit_session_invites;
CREATE POLICY "Users can create invites" 
ON public.livekit_session_invites 
FOR INSERT 
WITH CHECK (inviter_id IN (SELECT user_id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their invites" ON public.livekit_session_invites;
CREATE POLICY "Users can update their invites" 
ON public.livekit_session_invites 
FOR UPDATE 
USING (
  invitee_id IN (SELECT user_id FROM profiles WHERE user_id = auth.uid())
  OR inviter_id IN (SELECT user_id FROM profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete their invites" ON public.livekit_session_invites;
CREATE POLICY "Users can delete their invites" 
ON public.livekit_session_invites 
FOR DELETE 
USING (
  invitee_id IN (SELECT user_id FROM profiles WHERE user_id = auth.uid())
  OR inviter_id IN (SELECT user_id FROM profiles WHERE user_id = auth.uid())
);