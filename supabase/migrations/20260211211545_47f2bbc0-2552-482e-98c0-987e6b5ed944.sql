
-- Add new columns to clans table for recruitment features
ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS min_level integer DEFAULT 0;
ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS is_recruiting boolean DEFAULT true;
ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS invite_code text UNIQUE DEFAULT substr(md5(random()::text), 1, 8);
ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS max_members integer DEFAULT 30;
ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS clan_xp integer DEFAULT 0;
ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS clan_level integer DEFAULT 1;
ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS badge_icon text DEFAULT 'shield';
ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS badge_color text DEFAULT '#FFD700';
ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS enterprise_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Update clan_members role to support new ranks
-- Existing roles: 'owner', 'member', 'leader'
-- New roles: 'leader', 'co_leader', 'elder', 'member'

-- Create parties table (small battle squads within clans)
CREATE TABLE public.parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  max_members integer DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view parties" ON public.parties
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Clan members can create parties" ON public.parties
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clan_members cm
      JOIN profiles p ON cm.user_id = p.id
      WHERE cm.clan_id = parties.clan_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Party creator or clan leader can update" ON public.parties
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = created_by AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM clan_members cm
      JOIN profiles p ON cm.user_id = p.id
      WHERE cm.clan_id = parties.clan_id AND p.user_id = auth.uid() AND cm.role IN ('leader', 'co_leader')
    )
  );

CREATE POLICY "Party creator or clan leader can delete" ON public.parties
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = created_by AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM clan_members cm
      JOIN profiles p ON cm.user_id = p.id
      WHERE cm.clan_id = parties.clan_id AND p.user_id = auth.uid() AND cm.role IN ('leader', 'co_leader')
    )
  );

-- Party members
CREATE TABLE public.party_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id uuid NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(party_id, user_id)
);

ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view party members" ON public.party_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Clan members can join parties" ON public.party_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = user_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can leave parties" ON public.party_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = user_id AND p.user_id = auth.uid()
    )
  );

-- Clan battle log
CREATE TABLE public.clan_battle_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  battle_id uuid REFERENCES public.battles(id) ON DELETE SET NULL,
  war_id uuid REFERENCES public.clan_wars(id) ON DELETE SET NULL,
  event_type text NOT NULL, -- 'war_won', 'war_lost', 'battle_won', 'battle_lost', 'member_joined', 'xp_earned'
  description text,
  xp_earned integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.clan_battle_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view clan battle logs" ON public.clan_battle_log
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "System inserts battle logs" ON public.clan_battle_log
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clan_members cm
      JOIN profiles p ON cm.user_id = p.id
      WHERE cm.clan_id = clan_battle_log.clan_id AND p.user_id = auth.uid()
    )
  );

-- Clan join requests (for recruitment)
CREATE TABLE public.clan_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  reviewed_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clan_id, user_id)
);

ALTER TABLE public.clan_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests" ON public.clan_join_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = user_id AND p.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM clan_members cm
      JOIN profiles p ON cm.user_id = p.id
      WHERE cm.clan_id = clan_join_requests.clan_id AND p.user_id = auth.uid() AND cm.role IN ('leader', 'co_leader')
    )
  );

CREATE POLICY "Users can create join requests" ON public.clan_join_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = user_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Clan leaders can update requests" ON public.clan_join_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clan_members cm
      JOIN profiles p ON cm.user_id = p.id
      WHERE cm.clan_id = clan_join_requests.clan_id AND p.user_id = auth.uid() AND cm.role IN ('leader', 'co_leader')
    )
  );

-- Enable realtime for clan battle log
ALTER PUBLICATION supabase_realtime ADD TABLE public.clan_battle_log;
