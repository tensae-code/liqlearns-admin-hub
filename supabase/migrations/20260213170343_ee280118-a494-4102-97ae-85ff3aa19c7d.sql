
-- Table to track which side shared members pick in a clan war
CREATE TABLE public.clan_war_side_picks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  war_id UUID NOT NULL REFERENCES public.clan_wars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chosen_clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (war_id, user_id)
);

ALTER TABLE public.clan_war_side_picks ENABLE ROW LEVEL SECURITY;

-- Users can view side picks for wars they're involved in
CREATE POLICY "Authenticated users can view war side picks"
ON public.clan_war_side_picks FOR SELECT TO authenticated
USING (true);

-- Users can insert their own side pick
CREATE POLICY "Users can pick their side"
ON public.clan_war_side_picks FOR INSERT TO authenticated
WITH CHECK (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Users can update their own pick (before war starts)
CREATE POLICY "Users can update their own pick"
ON public.clan_war_side_picks FOR UPDATE TO authenticated
USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
