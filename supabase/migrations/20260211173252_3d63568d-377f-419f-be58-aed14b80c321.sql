
-- Battle Points wallet for each user (starts with 50 ETB equivalent on registration)
CREATE TABLE public.battle_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 50,
  total_won NUMERIC NOT NULL DEFAULT 0,
  total_lost NUMERIC NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  rank_points INTEGER NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Battle challenges
CREATE TABLE public.battles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID NOT NULL REFERENCES public.profiles(id),
  opponent_id UUID REFERENCES public.profiles(id),
  course_id UUID REFERENCES public.courses(id),
  game_id UUID REFERENCES public.game_templates(id),
  stake_amount NUMERIC NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'expired')),
  winner_id UUID REFERENCES public.profiles(id),
  challenger_score INTEGER,
  opponent_score INTEGER,
  challenger_time_seconds INTEGER,
  opponent_time_seconds INTEGER,
  is_open BOOLEAN NOT NULL DEFAULT false,
  voice_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Battle chat messages
CREATE TABLE public.battle_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id UUID NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.battle_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_messages ENABLE ROW LEVEL SECURITY;

-- Battle wallets: users can view all (for leaderboard) but only update own
CREATE POLICY "Anyone can view battle wallets" ON public.battle_wallets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own wallet" ON public.battle_wallets FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users update own wallet" ON public.battle_wallets FOR UPDATE TO authenticated USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Battles: participants can view, authenticated can create
CREATE POLICY "View battles" ON public.battles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create battles" ON public.battles FOR INSERT TO authenticated WITH CHECK (challenger_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Update own battles" ON public.battles FOR UPDATE TO authenticated USING (
  challenger_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR opponent_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Battle messages: participants can view and send
CREATE POLICY "View battle messages" ON public.battle_messages FOR SELECT TO authenticated USING (
  battle_id IN (SELECT id FROM battles WHERE challenger_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR opponent_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
);
CREATE POLICY "Send battle messages" ON public.battle_messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Enable realtime for battles
ALTER PUBLICATION supabase_realtime ADD TABLE public.battles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_messages;

-- Trigger for updated_at
CREATE TRIGGER update_battle_wallets_updated_at BEFORE UPDATE ON public.battle_wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_battles_updated_at BEFORE UPDATE ON public.battles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
