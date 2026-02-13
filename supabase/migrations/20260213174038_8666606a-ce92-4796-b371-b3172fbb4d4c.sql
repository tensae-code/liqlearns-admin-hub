
-- Add battle mode and team/spectator fields to battles table
ALTER TABLE public.battles 
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT '1v1',
  ADD COLUMN IF NOT EXISTS max_team_size integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_judged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS judge_id uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_spectators boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS spectator_camera boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS spectator_audio boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS spectator_chat boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS game_type text;

-- Battle team members (for team modes like 1v2, 5v5)
CREATE TABLE IF NOT EXISTS public.battle_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  team text NOT NULL CHECK (team IN ('challenger', 'opponent')),
  score integer DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(battle_id, user_id)
);

ALTER TABLE public.battle_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view battle team members"
  ON public.battle_team_members FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users can join battle teams"
  ON public.battle_team_members FOR INSERT
  TO authenticated WITH CHECK (user_id = public.get_my_profile_id());

CREATE POLICY "Users can update own team entry"
  ON public.battle_team_members FOR UPDATE
  TO authenticated USING (user_id = public.get_my_profile_id());

-- Battle spectators
CREATE TABLE IF NOT EXISTS public.battle_spectators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(battle_id, user_id)
);

ALTER TABLE public.battle_spectators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view spectators"
  ON public.battle_spectators FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users can spectate battles"
  ON public.battle_spectators FOR INSERT
  TO authenticated WITH CHECK (user_id = public.get_my_profile_id());

CREATE POLICY "Users can leave spectating"
  ON public.battle_spectators FOR DELETE
  TO authenticated USING (user_id = public.get_my_profile_id());

-- Battle follows (follow players/clans/parties to get notified of their battles)
CREATE TABLE IF NOT EXISTS public.battle_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES public.profiles(id),
  target_type text NOT NULL CHECK (target_type IN ('player', 'clan', 'party', 'enterprise')),
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, target_type, target_id)
);

ALTER TABLE public.battle_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view follows"
  ON public.battle_follows FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users can follow"
  ON public.battle_follows FOR INSERT
  TO authenticated WITH CHECK (follower_id = public.get_my_profile_id());

CREATE POLICY "Users can unfollow"
  ON public.battle_follows FOR DELETE
  TO authenticated USING (follower_id = public.get_my_profile_id());

-- Battle rankings (per game type, per group, overall)
CREATE TABLE IF NOT EXISTS public.battle_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('player', 'clan', 'party', 'enterprise')),
  entity_id uuid NOT NULL,
  game_type text,
  category text NOT NULL DEFAULT 'overall',
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  draws integer NOT NULL DEFAULT 0,
  rank_points integer NOT NULL DEFAULT 1000,
  total_battles integer NOT NULL DEFAULT 0,
  win_streak integer NOT NULL DEFAULT 0,
  best_streak integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id, game_type, category)
);

ALTER TABLE public.battle_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rankings"
  ON public.battle_rankings FOR SELECT
  TO authenticated USING (true);

-- Enable realtime for spectators
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_spectators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_team_members;
