
-- Clan Wars: a war is between two clans, involving multiple battles across multiple game types
CREATE TABLE public.clan_wars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_clan_id UUID NOT NULL REFERENCES public.clans(id),
  opponent_clan_id UUID NOT NULL REFERENCES public.clans(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, in_progress, completed, cancelled
  total_games INTEGER NOT NULL DEFAULT 5,
  challenger_score INTEGER NOT NULL DEFAULT 0,
  opponent_score INTEGER NOT NULL DEFAULT 0,
  winner_clan_id UUID REFERENCES public.clans(id),
  stake_per_member INTEGER NOT NULL DEFAULT 10,
  game_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clan_wars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clan wars" ON public.clan_wars FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Clan members can create wars" ON public.clan_wars FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM clan_members cm JOIN profiles p ON cm.user_id = p.id WHERE cm.clan_id = challenger_clan_id AND p.user_id = auth.uid() AND cm.role IN ('leader', 'co-leader'))
);
CREATE POLICY "War participants can update" ON public.clan_wars FOR UPDATE USING (
  EXISTS (SELECT 1 FROM clan_members cm JOIN profiles p ON cm.user_id = p.id WHERE (cm.clan_id = challenger_clan_id OR cm.clan_id = opponent_clan_id) AND p.user_id = auth.uid())
);

-- Clan War Rounds: individual matchups within a clan war  
CREATE TABLE public.clan_war_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  war_id UUID NOT NULL REFERENCES public.clan_wars(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL DEFAULT 1,
  game_id UUID REFERENCES public.game_templates(id),
  challenger_player_id UUID REFERENCES public.profiles(id),
  opponent_player_id UUID REFERENCES public.profiles(id),
  challenger_score INTEGER,
  opponent_score INTEGER,
  winner_player_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed
  battle_id UUID REFERENCES public.battles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.clan_war_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view rounds" ON public.clan_war_rounds FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "War participants can manage rounds" ON public.clan_war_rounds FOR ALL USING (auth.uid() IS NOT NULL);

-- Per-game-type ELO ratings: tracks skill per game type so matchmaking is fair
CREATE TABLE public.player_game_elo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  game_type TEXT NOT NULL, -- 'quiz', 'memory', 'word_search', etc.
  elo_rating INTEGER NOT NULL DEFAULT 1000,
  games_played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_type)
);

ALTER TABLE public.player_game_elo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all ELO" ON public.player_game_elo FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage own ELO" ON public.player_game_elo FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can update own ELO" ON public.player_game_elo FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);

-- Enable realtime for clan wars
ALTER PUBLICATION supabase_realtime ADD TABLE public.clan_wars;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clan_war_rounds;
