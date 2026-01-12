
-- =============================================
-- STUDY ROOMS SYSTEM
-- =============================================

-- Study room types enum
CREATE TYPE public.study_room_type AS ENUM ('public', 'private', 'kids');

-- Study rooms table
CREATE TABLE public.study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  room_type study_room_type NOT NULL DEFAULT 'public',
  host_id UUID NOT NULL,
  study_topic TEXT,
  education_level TEXT, -- e.g., 'high_school', 'bachelors', 'masters', 'phd'
  country TEXT,
  max_participants INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Study room participants
CREATE TABLE public.study_room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  study_title TEXT, -- What they're currently studying
  is_mic_on BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Pin system for study rooms
CREATE TABLE public.study_room_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  pinner_id UUID NOT NULL, -- Who pinned
  pinned_user_id UUID NOT NULL, -- Who is pinned
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, pinner_id, pinned_user_id)
);

-- =============================================
-- GROUPS SYSTEM
-- =============================================

-- Groups table
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL, -- For searchability
  description TEXT,
  avatar_url TEXT,
  owner_id UUID NOT NULL,
  invite_link TEXT UNIQUE,
  is_public BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Group member roles enum
CREATE TYPE public.group_role AS ENUM ('owner', 'admin', 'member');

-- Group members
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role group_role NOT NULL DEFAULT 'member',
  admin_title TEXT, -- Custom title given by owner to admins
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Channel types enum
CREATE TYPE public.channel_type AS ENUM ('text', 'announcement', 'voice');

-- Group channels (partitions)
CREATE TABLE public.group_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  channel_type channel_type NOT NULL DEFAULT 'text',
  is_default BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Group channel messages
CREATE TABLE public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.group_channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  reply_to_id UUID REFERENCES public.group_messages(id),
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- FRIENDS & DM SYSTEM
-- =============================================

-- Friendship status enum
CREATE TYPE public.friendship_status AS ENUM ('pending', 'accepted', 'blocked');

-- Friendships table
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL,
  addressee_id UUID NOT NULL,
  status friendship_status NOT NULL DEFAULT 'pending',
  parent_approved BOOLEAN DEFAULT false, -- For under 18 accounts
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

-- Direct messages
CREATE TABLE public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- MODERATION SYSTEM
-- =============================================

-- Report reasons enum
CREATE TYPE public.report_reason AS ENUM (
  'inappropriate_content',
  'harassment',
  'spam',
  'underage_violation',
  'other'
);

-- Reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  room_id UUID REFERENCES public.study_rooms(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  reason report_reason NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, reviewed, resolved
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- User bans
CREATE TABLE public.user_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  banned_from_type TEXT NOT NULL, -- 'study_room', 'group', 'platform'
  banned_from_id UUID, -- NULL for platform-wide bans
  banned_by UUID NOT NULL,
  reason TEXT,
  ban_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  ban_end TIMESTAMPTZ, -- NULL for permanent
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - STUDY ROOMS
-- =============================================

-- Anyone can view active public/kids study rooms
CREATE POLICY "Anyone can view public study rooms"
ON public.study_rooms FOR SELECT
USING (room_type IN ('public', 'kids') AND is_active = true);

-- Users can create study rooms
CREATE POLICY "Users can create study rooms"
ON public.study_rooms FOR INSERT
WITH CHECK (host_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Hosts can update their rooms
CREATE POLICY "Hosts can update their rooms"
ON public.study_rooms FOR UPDATE
USING (host_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Hosts can delete their rooms
CREATE POLICY "Hosts can delete their rooms"
ON public.study_rooms FOR DELETE
USING (host_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Study room participants policies
CREATE POLICY "Anyone can view room participants"
ON public.study_room_participants FOR SELECT
USING (true);

CREATE POLICY "Users can join rooms"
ON public.study_room_participants FOR INSERT
WITH CHECK (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their participation"
ON public.study_room_participants FOR UPDATE
USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can leave rooms"
ON public.study_room_participants FOR DELETE
USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Pin policies
CREATE POLICY "Participants can view pins"
ON public.study_room_pins FOR SELECT
USING (true);

CREATE POLICY "Users can pin others"
ON public.study_room_pins FOR INSERT
WITH CHECK (pinner_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can unpin"
ON public.study_room_pins FOR DELETE
USING (pinner_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- =============================================
-- RLS POLICIES - GROUPS
-- =============================================

-- Anyone can view public groups
CREATE POLICY "Anyone can view public groups"
ON public.groups FOR SELECT
USING (is_public = true);

-- Members can view their private groups
CREATE POLICY "Members can view their groups"
ON public.groups FOR SELECT
USING (EXISTS (
  SELECT 1 FROM group_members gm
  JOIN profiles p ON gm.user_id = p.id
  WHERE gm.group_id = groups.id AND p.user_id = auth.uid()
));

-- Users can create groups
CREATE POLICY "Users can create groups"
ON public.groups FOR INSERT
WITH CHECK (owner_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Owners can update groups
CREATE POLICY "Owners can update groups"
ON public.groups FOR UPDATE
USING (owner_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Owners can delete groups
CREATE POLICY "Owners can delete groups"
ON public.groups FOR DELETE
USING (owner_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Group members policies
CREATE POLICY "Members can view group members"
ON public.group_members FOR SELECT
USING (EXISTS (
  SELECT 1 FROM group_members gm
  JOIN profiles p ON gm.user_id = p.id
  WHERE gm.group_id = group_members.group_id AND p.user_id = auth.uid()
));

CREATE POLICY "Users can join groups"
ON public.group_members FOR INSERT
WITH CHECK (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage members"
ON public.group_members FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM group_members gm
  JOIN profiles p ON gm.user_id = p.id
  WHERE gm.group_id = group_members.group_id 
    AND p.user_id = auth.uid()
    AND gm.role IN ('owner', 'admin')
));

CREATE POLICY "Users can leave or admins can remove"
ON public.group_members FOR DELETE
USING (
  user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM group_members gm
    JOIN profiles p ON gm.user_id = p.id
    WHERE gm.group_id = group_members.group_id 
      AND p.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
  )
);

-- Group channels policies
CREATE POLICY "Members can view channels"
ON public.group_channels FOR SELECT
USING (EXISTS (
  SELECT 1 FROM group_members gm
  JOIN profiles p ON gm.user_id = p.id
  WHERE gm.group_id = group_channels.group_id AND p.user_id = auth.uid()
));

CREATE POLICY "Admins can create channels"
ON public.group_channels FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM group_members gm
  JOIN profiles p ON gm.user_id = p.id
  WHERE gm.group_id = group_channels.group_id 
    AND p.user_id = auth.uid()
    AND gm.role IN ('owner', 'admin')
));

CREATE POLICY "Admins can update channels"
ON public.group_channels FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM group_members gm
  JOIN profiles p ON gm.user_id = p.id
  WHERE gm.group_id = group_channels.group_id 
    AND p.user_id = auth.uid()
    AND gm.role IN ('owner', 'admin')
));

CREATE POLICY "Admins can delete channels"
ON public.group_channels FOR DELETE
USING (EXISTS (
  SELECT 1 FROM group_members gm
  JOIN profiles p ON gm.user_id = p.id
  WHERE gm.group_id = group_channels.group_id 
    AND p.user_id = auth.uid()
    AND gm.role IN ('owner', 'admin')
));

-- Group messages policies
CREATE POLICY "Members can view messages"
ON public.group_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM group_channels gc
  JOIN group_members gm ON gc.group_id = gm.group_id
  JOIN profiles p ON gm.user_id = p.id
  WHERE gc.id = group_messages.channel_id AND p.user_id = auth.uid()
));

CREATE POLICY "Members can send messages"
ON public.group_messages FOR INSERT
WITH CHECK (
  sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM group_channels gc
    JOIN group_members gm ON gc.group_id = gm.group_id
    JOIN profiles p ON gm.user_id = p.id
    WHERE gc.id = group_messages.channel_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Senders can edit messages"
ON public.group_messages FOR UPDATE
USING (sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Senders or admins can delete messages"
ON public.group_messages FOR DELETE
USING (
  sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM group_channels gc
    JOIN group_members gm ON gc.group_id = gm.group_id
    JOIN profiles p ON gm.user_id = p.id
    WHERE gc.id = group_messages.channel_id 
      AND p.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
  )
);

-- =============================================
-- RLS POLICIES - FRIENDSHIPS & DMS
-- =============================================

-- Friendships policies
CREATE POLICY "Users can view their friendships"
ON public.friendships FOR SELECT
USING (
  requester_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR addressee_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can send friend requests"
ON public.friendships FOR INSERT
WITH CHECK (requester_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their friendships"
ON public.friendships FOR UPDATE
USING (
  requester_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR addressee_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete friendships"
ON public.friendships FOR DELETE
USING (
  requester_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR addressee_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Direct messages policies
CREATE POLICY "Users can view their DMs"
ON public.direct_messages FOR SELECT
USING (
  sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR receiver_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can send DMs to friends"
ON public.direct_messages FOR INSERT
WITH CHECK (
  sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.status = 'accepted'
      AND (
        (f.requester_id = direct_messages.sender_id AND f.addressee_id = direct_messages.receiver_id)
        OR (f.addressee_id = direct_messages.sender_id AND f.requester_id = direct_messages.receiver_id)
      )
  )
);

CREATE POLICY "Receivers can mark DMs as read"
ON public.direct_messages FOR UPDATE
USING (receiver_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- =============================================
-- RLS POLICIES - MODERATION
-- =============================================

-- Reports policies
CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT
WITH CHECK (reporter_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Reporters can view their reports"
ON public.reports FOR SELECT
USING (reporter_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all reports"
ON public.reports FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));

CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));

-- User bans policies
CREATE POLICY "Admins can create bans"
ON public.user_bans FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));

CREATE POLICY "Users can view their own bans"
ON public.user_bans FOR SELECT
USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all bans"
ON public.user_bans FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));

CREATE POLICY "Admins can update bans"
ON public.user_bans FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));

CREATE POLICY "Admins can delete bans"
ON public.user_bans FOR DELETE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_study_rooms_type ON public.study_rooms(room_type);
CREATE INDEX idx_study_rooms_host ON public.study_rooms(host_id);
CREATE INDEX idx_study_room_participants_room ON public.study_room_participants(room_id);
CREATE INDEX idx_study_room_participants_user ON public.study_room_participants(user_id);
CREATE INDEX idx_groups_username ON public.groups(username);
CREATE INDEX idx_groups_owner ON public.groups(owner_id);
CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);
CREATE INDEX idx_group_channels_group ON public.group_channels(group_id);
CREATE INDEX idx_group_messages_channel ON public.group_messages(channel_id);
CREATE INDEX idx_group_messages_sender ON public.group_messages(sender_id);
CREATE INDEX idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX idx_direct_messages_receiver ON public.direct_messages(receiver_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_user_bans_user ON public.user_bans(user_id);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_study_rooms_updated_at
  BEFORE UPDATE ON public.study_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_messages_updated_at
  BEFORE UPDATE ON public.group_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ENABLE REALTIME FOR CHAT FEATURES
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_participants;
