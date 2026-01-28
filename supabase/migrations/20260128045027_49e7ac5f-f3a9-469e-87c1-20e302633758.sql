-- Create referral earnings/commission type enum
CREATE TYPE public.referral_reward_type AS ENUM ('level1', 'level2');
CREATE TYPE public.referral_status AS ENUM ('pending', 'paid', 'cancelled');

-- Create referral ranks table
CREATE TABLE public.referral_ranks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  level integer NOT NULL UNIQUE,
  min_referrals integer NOT NULL DEFAULT 0,
  min_earnings numeric NOT NULL DEFAULT 0,
  badge_icon text NOT NULL DEFAULT 'star',
  badge_color text NOT NULL DEFAULT 'amber',
  bonus_percent numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default ranks
INSERT INTO public.referral_ranks (name, level, min_referrals, min_earnings, badge_icon, badge_color, bonus_percent) VALUES
  ('Starter', 1, 0, 0, 'seedling', 'slate', 0),
  ('Referrer', 2, 3, 50, 'leaf', 'green', 2),
  ('Advocate', 3, 10, 200, 'trophy', 'amber', 5),
  ('Ambassador', 4, 25, 500, 'crown', 'purple', 8),
  ('Elite Partner', 5, 50, 1500, 'gem', 'pink', 12);

-- Create referral settings table (for CEO to configure rates)
CREATE TABLE public.referral_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level1_percent numeric NOT NULL DEFAULT 15,
  level2_percent numeric NOT NULL DEFAULT 5,
  level2_cap numeric NOT NULL DEFAULT 50,
  min_payout numeric NOT NULL DEFAULT 20,
  payout_method text NOT NULL DEFAULT 'manual',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

-- Insert default settings
INSERT INTO public.referral_settings (level1_percent, level2_percent, level2_cap, min_payout) 
VALUES (15, 5, 50, 20);

-- Create referral rewards/commissions table
CREATE TABLE public.referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  earner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_type referral_reward_type NOT NULL,
  amount numeric NOT NULL,
  transaction_id uuid,
  status referral_status NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create referral stats table (cached aggregates for performance)
CREATE TABLE public.referral_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  direct_referrals integer NOT NULL DEFAULT 0,
  indirect_referrals integer NOT NULL DEFAULT 0,
  total_earnings numeric NOT NULL DEFAULT 0,
  pending_earnings numeric NOT NULL DEFAULT 0,
  paid_earnings numeric NOT NULL DEFAULT 0,
  current_rank_id uuid REFERENCES referral_ranks(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add sponsor_id to profiles if not exists (for tracking who referred whom)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'sponsor_id') THEN
    ALTER TABLE public.profiles ADD COLUMN sponsor_id uuid REFERENCES profiles(id);
  END IF;
END $$;

-- Create index for referral tree queries
CREATE INDEX idx_profiles_sponsor ON public.profiles(sponsor_id) WHERE sponsor_id IS NOT NULL;
CREATE INDEX idx_referral_rewards_earner ON public.referral_rewards(earner_id);
CREATE INDEX idx_referral_rewards_source ON public.referral_rewards(source_user_id);
CREATE INDEX idx_referral_rewards_status ON public.referral_rewards(status);

-- Enable RLS
ALTER TABLE public.referral_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_ranks (publicly viewable)
CREATE POLICY "Anyone can view referral ranks"
  ON public.referral_ranks FOR SELECT USING (true);

CREATE POLICY "Only CEO can manage ranks"
  ON public.referral_ranks FOR ALL
  USING (has_role(auth.uid(), 'ceo'));

-- RLS Policies for referral_settings
CREATE POLICY "Anyone can view referral settings"
  ON public.referral_settings FOR SELECT USING (true);

CREATE POLICY "Only CEO can update settings"
  ON public.referral_settings FOR UPDATE
  USING (has_role(auth.uid(), 'ceo'));

-- RLS Policies for referral_rewards
CREATE POLICY "Users can view their own rewards"
  ON public.referral_rewards FOR SELECT
  USING (earner_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all rewards"
  ON public.referral_rewards FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));

CREATE POLICY "System can insert rewards"
  ON public.referral_rewards FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can update reward status"
  ON public.referral_rewards FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));

-- RLS Policies for referral_stats
CREATE POLICY "Users can view their own stats"
  ON public.referral_stats FOR SELECT
  USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own stats"
  ON public.referral_stats FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can update stats"
  ON public.referral_stats FOR UPDATE
  USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all stats"
  ON public.referral_stats FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));

-- Function to get direct referrals
CREATE OR REPLACE FUNCTION public.get_direct_referrals(p_profile_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  username text,
  avatar_url text,
  created_at timestamptz,
  subscription_status text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.username, p.avatar_url, p.created_at, p.subscription_status
  FROM profiles p
  WHERE p.sponsor_id = p_profile_id
  ORDER BY p.created_at DESC;
$$;

-- Function to get indirect referrals (level 2)
CREATE OR REPLACE FUNCTION public.get_indirect_referrals(p_profile_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  username text,
  avatar_url text,
  referred_by_name text,
  created_at timestamptz,
  subscription_status text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id, 
    p.full_name, 
    p.username, 
    p.avatar_url,
    sponsor.full_name as referred_by_name,
    p.created_at, 
    p.subscription_status
  FROM profiles p
  JOIN profiles sponsor ON p.sponsor_id = sponsor.id
  WHERE sponsor.sponsor_id = p_profile_id
  ORDER BY p.created_at DESC;
$$;

-- Function to update referral stats
CREATE OR REPLACE FUNCTION public.update_referral_stats(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_direct_count integer;
  v_indirect_count integer;
  v_total_earnings numeric;
  v_pending_earnings numeric;
  v_paid_earnings numeric;
  v_rank_id uuid;
BEGIN
  -- Count direct referrals
  SELECT COUNT(*) INTO v_direct_count
  FROM profiles WHERE sponsor_id = p_user_id;
  
  -- Count indirect referrals
  SELECT COUNT(*) INTO v_indirect_count
  FROM profiles p
  JOIN profiles sponsor ON p.sponsor_id = sponsor.id
  WHERE sponsor.sponsor_id = p_user_id;
  
  -- Sum earnings
  SELECT 
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0)
  INTO v_total_earnings, v_pending_earnings, v_paid_earnings
  FROM referral_rewards
  WHERE earner_id = p_user_id;
  
  -- Determine rank
  SELECT id INTO v_rank_id
  FROM referral_ranks
  WHERE min_referrals <= v_direct_count AND min_earnings <= v_paid_earnings
  ORDER BY level DESC
  LIMIT 1;
  
  -- Upsert stats
  INSERT INTO referral_stats (user_id, direct_referrals, indirect_referrals, total_earnings, pending_earnings, paid_earnings, current_rank_id, updated_at)
  VALUES (p_user_id, v_direct_count, v_indirect_count, v_total_earnings, v_pending_earnings, v_paid_earnings, v_rank_id, now())
  ON CONFLICT (user_id) DO UPDATE SET
    direct_referrals = EXCLUDED.direct_referrals,
    indirect_referrals = EXCLUDED.indirect_referrals,
    total_earnings = EXCLUDED.total_earnings,
    pending_earnings = EXCLUDED.pending_earnings,
    paid_earnings = EXCLUDED.paid_earnings,
    current_rank_id = EXCLUDED.current_rank_id,
    updated_at = now();
END;
$$;