-- LiveKit Session Management Tables

-- Session role enum
CREATE TYPE public.session_role AS ENUM ('host', 'moderator', 'speaker', 'listener');

-- Session context type enum
CREATE TYPE public.session_context AS ENUM ('dm', 'group', 'study_room');

-- Sessions table - tracks active LiveKit rooms
CREATE TABLE public.livekit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name TEXT NOT NULL UNIQUE,
  context_type session_context NOT NULL,
  context_id UUID NOT NULL,
  host_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  max_speakers INTEGER NOT NULL DEFAULT 8,
  active_screenshare_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Session participants table - tracks who's in a session
CREATE TABLE public.livekit_session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.livekit_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role session_role NOT NULL DEFAULT 'listener',
  is_hand_raised BOOLEAN NOT NULL DEFAULT false,
  is_muted BOOLEAN NOT NULL DEFAULT false,
  is_video_on BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(session_id, user_id)
);

-- Session invites table - for add-to-call functionality
CREATE TABLE public.livekit_session_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.livekit_sessions(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(session_id, invitee_id)
);

-- Indexes for performance
CREATE INDEX idx_livekit_sessions_room_name ON public.livekit_sessions(room_name);
CREATE INDEX idx_livekit_sessions_context ON public.livekit_sessions(context_type, context_id);
CREATE INDEX idx_livekit_sessions_status ON public.livekit_sessions(status);
CREATE INDEX idx_livekit_participants_session ON public.livekit_session_participants(session_id);
CREATE INDEX idx_livekit_participants_user ON public.livekit_session_participants(user_id);
CREATE INDEX idx_livekit_invites_invitee ON public.livekit_session_invites(invitee_id, status);

-- Enable RLS
ALTER TABLE public.livekit_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livekit_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livekit_session_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for livekit_sessions
CREATE POLICY "Users can view sessions they're part of"
ON public.livekit_sessions FOR SELECT
USING (
  id IN (
    SELECT session_id FROM public.livekit_session_participants 
    WHERE user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
  )
  OR host_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Users can create sessions"
ON public.livekit_sessions FOR INSERT
WITH CHECK (
  host_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Hosts can update their sessions"
ON public.livekit_sessions FOR UPDATE
USING (
  host_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
);

-- RLS Policies for livekit_session_participants
CREATE POLICY "Users can view participants in their sessions"
ON public.livekit_session_participants FOR SELECT
USING (
  session_id IN (
    SELECT id FROM public.livekit_sessions 
    WHERE id IN (
      SELECT session_id FROM public.livekit_session_participants 
      WHERE user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
    )
    OR host_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
  )
);

CREATE POLICY "Users can join sessions"
ON public.livekit_session_participants FOR INSERT
WITH CHECK (
  user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Users can update their own participation"
ON public.livekit_session_participants FOR UPDATE
USING (
  user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
  OR session_id IN (
    SELECT id FROM public.livekit_sessions 
    WHERE host_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
  )
);

CREATE POLICY "Users can leave sessions"
ON public.livekit_session_participants FOR DELETE
USING (
  user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
);

-- RLS Policies for livekit_session_invites
CREATE POLICY "Users can view their invites"
ON public.livekit_session_invites FOR SELECT
USING (
  invitee_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
  OR inviter_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Session members can send invites"
ON public.livekit_session_invites FOR INSERT
WITH CHECK (
  inviter_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
  AND session_id IN (
    SELECT id FROM public.livekit_sessions 
    WHERE id IN (
      SELECT session_id FROM public.livekit_session_participants 
      WHERE user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
    )
  )
);

CREATE POLICY "Invitees can update their invites"
ON public.livekit_session_invites FOR UPDATE
USING (
  invitee_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
);

-- Enable realtime for session participants (for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.livekit_session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.livekit_session_invites;