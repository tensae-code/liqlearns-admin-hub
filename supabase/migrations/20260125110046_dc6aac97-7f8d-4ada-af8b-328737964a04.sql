-- Fix the RLS policy for livekit_session_participants that causes infinite recursion
-- The issue is the SELECT policy references itself

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view participants in their sessions" ON public.livekit_session_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON public.livekit_session_participants;

-- Create a helper function to check session participation without recursion
CREATE OR REPLACE FUNCTION public.is_session_participant(p_session_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM livekit_session_participants lsp
    JOIN profiles p ON lsp.user_id = p.id
    WHERE lsp.session_id = p_session_id AND p.user_id = p_user_id
  );
$$;

-- Create a helper function to check if user is session host
CREATE OR REPLACE FUNCTION public.is_session_host(p_session_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM livekit_sessions ls
    JOIN profiles p ON ls.host_id = p.id
    WHERE ls.id = p_session_id AND p.user_id = p_user_id
  );
$$;

-- Recreate the SELECT policy using the helper functions
CREATE POLICY "Users can view participants in their sessions"
ON public.livekit_session_participants
FOR SELECT
USING (
  is_session_participant(session_id, auth.uid()) 
  OR is_session_host(session_id, auth.uid())
);

-- Recreate the UPDATE policy using helper functions
CREATE POLICY "Users can update their own participation"
ON public.livekit_session_participants
FOR UPDATE
USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR is_session_host(session_id, auth.uid())
);

-- Also fix the INSERT policy on livekit_session_invites that references the recursive table
DROP POLICY IF EXISTS "Session members can send invites" ON public.livekit_session_invites;

-- Recreate using the helper function
CREATE POLICY "Session members can send invites"
ON public.livekit_session_invites
FOR INSERT
WITH CHECK (
  inviter_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND is_session_participant(session_id, auth.uid())
);