
-- Coin system tables
CREATE TABLE public.coin_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  monthly_allocation INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  last_monthly_credit TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Subscription tiers with coin allocations
CREATE TABLE public.subscription_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  monthly_coins INTEGER NOT NULL DEFAULT 0,
  price_etb NUMERIC NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Coin transactions log
CREATE TABLE public.coin_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'monthly_credit', 'purchase', 'battle_convert', 'battle_entry', 'level_activation', 'reward'
  description TEXT,
  reference_id UUID, -- battle_id, skill_level_id, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Battle point to coin conversion rates
CREATE TABLE public.coin_conversion_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_points_required INTEGER NOT NULL DEFAULT 100,
  coins_given INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coin_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_conversion_rates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own coin wallet" ON public.coin_wallets FOR SELECT USING (user_id = public.get_my_profile_id());
CREATE POLICY "Users can update own coin wallet" ON public.coin_wallets FOR UPDATE USING (user_id = public.get_my_profile_id());
CREATE POLICY "Users can insert own coin wallet" ON public.coin_wallets FOR INSERT WITH CHECK (user_id = public.get_my_profile_id());

CREATE POLICY "Anyone can view subscription tiers" ON public.subscription_tiers FOR SELECT USING (true);

CREATE POLICY "Users can view own coin transactions" ON public.coin_transactions FOR SELECT USING (user_id = public.get_my_profile_id());
CREATE POLICY "Users can insert own coin transactions" ON public.coin_transactions FOR INSERT WITH CHECK (user_id = public.get_my_profile_id());

CREATE POLICY "Anyone can view conversion rates" ON public.coin_conversion_rates FOR SELECT USING (true);

-- Auto-create coin wallet for new profiles
CREATE OR REPLACE FUNCTION public.create_coin_wallet_for_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.coin_wallets (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_coin_wallet ON profiles;
CREATE TRIGGER trigger_create_coin_wallet
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_coin_wallet_for_user();

-- Seed default subscription tiers
INSERT INTO public.subscription_tiers (name, slug, monthly_coins, price_etb, sort_order, features) VALUES
  ('Free', 'free', 50, 0, 0, '["50 coins/month", "Basic battles", "View courses"]'::jsonb),
  ('Starter', 'starter', 200, 99, 1, '["200 coins/month", "Unlimited battles", "Priority matching"]'::jsonb),
  ('Pro', 'pro', 500, 249, 2, '["500 coins/month", "All features", "Battle replays", "Advanced analytics"]'::jsonb),
  ('Elite', 'elite', 1500, 499, 3, '["1500 coins/month", "Everything in Pro", "Custom clans", "VIP support"]'::jsonb);

-- Seed default conversion rate
INSERT INTO public.coin_conversion_rates (battle_points_required, coins_given) VALUES (100, 10);

-- Function to convert battle points to coins
CREATE OR REPLACE FUNCTION public.convert_battle_points_to_coins(p_user_id UUID, p_battle_points INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rate RECORD;
  v_conversions INTEGER;
  v_coins INTEGER;
  v_current_bp INTEGER;
BEGIN
  -- Get active conversion rate
  SELECT * INTO v_rate FROM coin_conversion_rates WHERE is_active = true LIMIT 1;
  IF v_rate IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No conversion rate configured');
  END IF;

  -- Check battle wallet balance
  SELECT balance INTO v_current_bp FROM battle_wallets WHERE user_id = p_user_id;
  IF v_current_bp IS NULL OR v_current_bp < v_rate.battle_points_required THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient battle points');
  END IF;

  -- Calculate how many conversions possible with given points
  v_conversions := LEAST(p_battle_points / v_rate.battle_points_required, v_current_bp / v_rate.battle_points_required);
  IF v_conversions < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough points for conversion');
  END IF;

  v_coins := v_conversions * v_rate.coins_given;
  
  -- Deduct battle points
  UPDATE battle_wallets SET balance = balance - (v_conversions * v_rate.battle_points_required), updated_at = now() WHERE user_id = p_user_id;

  -- Credit coins
  INSERT INTO coin_wallets (user_id, balance, total_earned) VALUES (p_user_id, v_coins, v_coins)
  ON CONFLICT (user_id) DO UPDATE SET balance = coin_wallets.balance + v_coins, total_earned = coin_wallets.total_earned + v_coins, updated_at = now();

  -- Log transaction
  INSERT INTO coin_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, v_coins, 'battle_convert', 'Converted ' || (v_conversions * v_rate.battle_points_required) || ' battle points to ' || v_coins || ' coins');

  RETURN jsonb_build_object('success', true, 'coins_earned', v_coins, 'bp_spent', v_conversions * v_rate.battle_points_required);
END;
$$;
