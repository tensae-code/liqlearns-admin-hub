-- Add missing columns to subscription_tiers
ALTER TABLE public.subscription_tiers ADD COLUMN IF NOT EXISTS tokens_per_month INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.subscription_tiers ADD COLUMN IF NOT EXISTS ai_calls_per_day INTEGER NOT NULL DEFAULT 5;
ALTER TABLE public.subscription_tiers ADD COLUMN IF NOT EXISTS max_weekly_bp_conversion INTEGER NOT NULL DEFAULT 0;

-- Update existing tiers with token data
UPDATE public.subscription_tiers SET tokens_per_month = 10, ai_calls_per_day = 5, max_weekly_bp_conversion = 0 WHERE slug = 'free' OR name ILIKE '%free%';
UPDATE public.subscription_tiers SET tokens_per_month = 50, ai_calls_per_day = 25, max_weekly_bp_conversion = 100 WHERE slug = 'plus' OR name ILIKE '%plus%';
UPDATE public.subscription_tiers SET tokens_per_month = 150, ai_calls_per_day = 100, max_weekly_bp_conversion = 500 WHERE slug = 'pro' OR name ILIKE '%pro%';

-- BP to Token conversion function
CREATE OR REPLACE FUNCTION public.convert_bp_to_tokens(p_user_id UUID, p_bp_amount INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_bp INTEGER;
  v_tokens_out INTEGER;
  v_weekly_used INTEGER;
  v_max_weekly INTEGER;
  v_sub_plan TEXT;
BEGIN
  SELECT subscription_plan INTO v_sub_plan FROM profiles WHERE id = p_user_id;
  
  SELECT max_weekly_bp_conversion INTO v_max_weekly
  FROM subscription_tiers WHERE name = COALESCE(v_sub_plan, 'Free') OR slug = lower(COALESCE(v_sub_plan, 'free'))
  LIMIT 1;
  v_max_weekly := COALESCE(v_max_weekly, 0);
  
  IF v_max_weekly = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Your plan does not allow BP conversion. Upgrade to Plus or Pro.');
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_weekly_used
  FROM token_transactions
  WHERE user_id = p_user_id AND transaction_type = 'bp_convert'
  AND created_at >= date_trunc('week', now());

  IF v_weekly_used >= v_max_weekly THEN
    RETURN jsonb_build_object('success', false, 'error', 'Weekly conversion limit reached');
  END IF;

  SELECT balance INTO v_current_bp FROM battle_wallets WHERE user_id = p_user_id;
  IF v_current_bp IS NULL OR v_current_bp < p_bp_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient battle points');
  END IF;

  v_tokens_out := (p_bp_amount / 100) * 10;
  IF v_tokens_out < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Need at least 100 BP to convert');
  END IF;

  IF v_weekly_used + v_tokens_out > v_max_weekly THEN
    v_tokens_out := v_max_weekly - v_weekly_used;
  END IF;

  UPDATE battle_wallets SET balance = balance - (v_tokens_out * 10), updated_at = now() WHERE user_id = p_user_id;

  INSERT INTO token_wallets (user_id, balance, total_earned) VALUES (p_user_id, v_tokens_out, v_tokens_out)
  ON CONFLICT (user_id) DO UPDATE SET balance = token_wallets.balance + v_tokens_out, total_earned = token_wallets.total_earned + v_tokens_out, updated_at = now();

  INSERT INTO token_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, v_tokens_out, 'bp_convert', 'Converted ' || (v_tokens_out * 10) || ' BP to ' || v_tokens_out || ' tokens');

  RETURN jsonb_build_object('success', true, 'tokens_earned', v_tokens_out, 'bp_spent', v_tokens_out * 10);
END;
$$;

-- Token wallet trigger
CREATE OR REPLACE FUNCTION public.create_token_wallet_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.token_wallets (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Add senior_teacher role
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'senior_teacher';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;