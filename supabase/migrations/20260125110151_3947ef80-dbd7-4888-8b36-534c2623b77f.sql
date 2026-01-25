-- Fix RLS policies on livekit_session_invites to use consistent profile ID checks
-- The inviter_id and invitee_id columns store PROFILE IDs, not auth user IDs

-- Drop the problematic policies that may remain
DROP POLICY IF EXISTS "Users can create invites" ON public.livekit_session_invites;
DROP POLICY IF EXISTS "Users can see invites for them" ON public.livekit_session_invites;
DROP POLICY IF EXISTS "Users can update their invites" ON public.livekit_session_invites;
DROP POLICY IF EXISTS "Users can delete their invites" ON public.livekit_session_invites;
DROP POLICY IF EXISTS "Users can view their invites" ON public.livekit_session_invites;
DROP POLICY IF EXISTS "Invitees can update their invites" ON public.livekit_session_invites;

-- Helper function to get current user's profile ID
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Users can create invites (they must be the inviter)
CREATE POLICY "Users can create invites"
ON public.livekit_session_invites
FOR INSERT
WITH CHECK (inviter_id = get_my_profile_id());

-- Users can view invites where they are inviter or invitee
CREATE POLICY "Users can view their invites"
ON public.livekit_session_invites
FOR SELECT
USING (
  inviter_id = get_my_profile_id() 
  OR invitee_id = get_my_profile_id()
);

-- Users can update invites where they are inviter or invitee
CREATE POLICY "Users can update their invites"
ON public.livekit_session_invites
FOR UPDATE
USING (
  inviter_id = get_my_profile_id() 
  OR invitee_id = get_my_profile_id()
);

-- Users can delete invites where they are inviter or invitee
CREATE POLICY "Users can delete their invites"
ON public.livekit_session_invites
FOR DELETE
USING (
  inviter_id = get_my_profile_id() 
  OR invitee_id = get_my_profile_id()
);