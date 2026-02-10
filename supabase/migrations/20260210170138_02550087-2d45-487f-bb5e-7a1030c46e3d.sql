
-- Commission Groups: CEO can create groups like Influencer, Sales, Ambassador, Professor, Parent, etc.
CREATE TABLE public.commission_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  l1_percent NUMERIC NOT NULL DEFAULT 15,
  l2_percent NUMERIC NOT NULL DEFAULT 5,
  l2_cap NUMERIC NOT NULL DEFAULT 50,
  icon TEXT DEFAULT '👤',
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.commission_groups ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read commission groups
CREATE POLICY "Anyone can read commission groups"
ON public.commission_groups FOR SELECT TO authenticated USING (true);

-- Only CEO can manage commission groups
CREATE POLICY "CEO can manage commission groups"
ON public.commission_groups FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'ceo'))
WITH CHECK (public.has_role(auth.uid(), 'ceo'));

-- Add commission_group_id to profiles
ALTER TABLE public.profiles ADD COLUMN commission_group_id UUID REFERENCES public.commission_groups(id) ON DELETE SET NULL;

-- Seed default commission groups
INSERT INTO public.commission_groups (name, description, l1_percent, l2_percent, l2_cap, icon, color) VALUES
  ('Standard', 'Default commission rates for regular users', 15, 5, 50, '👤', '#6366f1'),
  ('Influencer', 'Higher rates for social media influencers', 25, 8, 100, '⭐', '#f59e0b'),
  ('Sales Ambassador', 'Top-tier rates for dedicated sales people', 30, 10, 150, '🏆', '#10b981'),
  ('Professor', 'Academic professionals and educators', 20, 7, 75, '🎓', '#8b5cf6'),
  ('Parent', 'Parents referring other families', 18, 6, 60, '👨‍👩‍👧', '#ec4899');

-- Update purchase_course to use commission group rates instead of global settings
CREATE OR REPLACE FUNCTION public.purchase_course(p_buyer_id uuid, p_course_id uuid, p_amount numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_buyer_balance NUMERIC;
  v_instructor_id UUID;
  v_l1_referrer_id UUID;
  v_l2_referrer_id UUID;
  v_instructor_share NUMERIC;
  v_platform_share NUMERIC;
  v_l1_commission NUMERIC := 0;
  v_l2_commission NUMERIC := 0;
  v_l1_percent NUMERIC;
  v_l2_percent NUMERIC;
  v_l2_cap NUMERIC;
  v_already_enrolled BOOLEAN;
  v_commission_group_id UUID;
BEGIN
  -- Check if already enrolled
  SELECT EXISTS(
    SELECT 1 FROM enrollments WHERE user_id = p_buyer_id AND course_id = p_course_id
  ) INTO v_already_enrolled;
  
  IF v_already_enrolled THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already enrolled in this course');
  END IF;

  -- Get buyer balance
  SELECT balance INTO v_buyer_balance FROM wallets WHERE user_id = p_buyer_id FOR UPDATE;
  IF v_buyer_balance IS NULL THEN
    INSERT INTO wallets (user_id, balance) VALUES (p_buyer_id, 0);
    v_buyer_balance := 0;
  END IF;
  
  IF v_buyer_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Get course instructor
  SELECT instructor_id INTO v_instructor_id FROM courses WHERE id = p_course_id;

  -- Get referral chain
  SELECT sponsor_id INTO v_l1_referrer_id FROM profiles WHERE id = p_buyer_id;
  IF v_l1_referrer_id IS NOT NULL THEN
    SELECT sponsor_id INTO v_l2_referrer_id FROM profiles WHERE id = v_l1_referrer_id;
  END IF;

  -- Get commission rates from the L1 referrer's commission group, or fall back to global settings
  IF v_l1_referrer_id IS NOT NULL THEN
    SELECT cg.l1_percent, cg.l2_percent, cg.l2_cap
    INTO v_l1_percent, v_l2_percent, v_l2_cap
    FROM profiles p
    LEFT JOIN commission_groups cg ON p.commission_group_id = cg.id AND cg.is_active = true
    WHERE p.id = v_l1_referrer_id;
  END IF;

  -- Fall back to global referral settings if no commission group
  IF v_l1_percent IS NULL THEN
    SELECT level1_percent, level2_percent, level2_cap 
    INTO v_l1_percent, v_l2_percent, v_l2_cap
    FROM referral_settings LIMIT 1;
  END IF;
  
  v_l1_percent := COALESCE(v_l1_percent, 15);
  v_l2_percent := COALESCE(v_l2_percent, 5);
  v_l2_cap := COALESCE(v_l2_cap, 50);

  -- Calculate shares (instructor gets 70%, platform 30% minus commissions)
  v_instructor_share := p_amount * 0.70;
  
  -- Calculate L1 commission
  IF v_l1_referrer_id IS NOT NULL THEN
    v_l1_commission := p_amount * (v_l1_percent / 100.0);
  END IF;
  
  -- Calculate L2 commission (capped)
  IF v_l2_referrer_id IS NOT NULL THEN
    v_l2_commission := LEAST(p_amount * (v_l2_percent / 100.0), v_l2_cap);
  END IF;
  
  v_platform_share := p_amount - v_instructor_share - v_l1_commission - v_l2_commission;

  -- Deduct from buyer
  UPDATE wallets SET balance = balance - p_amount, total_spent = COALESCE(total_spent, 0) + p_amount, updated_at = now()
  WHERE user_id = p_buyer_id;

  -- Credit instructor
  IF v_instructor_id IS NOT NULL THEN
    INSERT INTO wallets (user_id, balance, total_earned) VALUES (v_instructor_id, v_instructor_share, v_instructor_share)
    ON CONFLICT (user_id) DO UPDATE SET balance = wallets.balance + v_instructor_share, total_earned = COALESCE(wallets.total_earned, 0) + v_instructor_share, updated_at = now();
  END IF;

  -- Credit L1 referrer
  IF v_l1_referrer_id IS NOT NULL AND v_l1_commission > 0 THEN
    INSERT INTO wallets (user_id, balance, total_earned) VALUES (v_l1_referrer_id, v_l1_commission, v_l1_commission)
    ON CONFLICT (user_id) DO UPDATE SET balance = wallets.balance + v_l1_commission, total_earned = COALESCE(wallets.total_earned, 0) + v_l1_commission, updated_at = now();
    
    INSERT INTO referral_rewards (earner_id, source_user_id, reward_type, amount, status)
    VALUES (v_l1_referrer_id, p_buyer_id, 'level1', v_l1_commission, 'paid');
    
    PERFORM update_referral_stats(v_l1_referrer_id);
  END IF;

  -- Credit L2 referrer
  IF v_l2_referrer_id IS NOT NULL AND v_l2_commission > 0 THEN
    INSERT INTO wallets (user_id, balance, total_earned) VALUES (v_l2_referrer_id, v_l2_commission, v_l2_commission)
    ON CONFLICT (user_id) DO UPDATE SET balance = wallets.balance + v_l2_commission, total_earned = COALESCE(wallets.total_earned, 0) + v_l2_commission, updated_at = now();
    
    INSERT INTO referral_rewards (earner_id, source_user_id, reward_type, amount, status)
    VALUES (v_l2_referrer_id, p_buyer_id, 'level2', v_l2_commission, 'paid');
    
    PERFORM update_referral_stats(v_l2_referrer_id);
  END IF;

  -- Create enrollment
  INSERT INTO enrollments (user_id, course_id) VALUES (p_buyer_id, p_course_id);

  -- Record purchase
  INSERT INTO course_purchases (buyer_id, course_id, instructor_id, amount, instructor_share, platform_share, l1_commission, l2_commission, l1_referrer_id, l2_referrer_id)
  VALUES (p_buyer_id, p_course_id, v_instructor_id, p_amount, v_instructor_share, v_platform_share, v_l1_commission, v_l2_commission, v_l1_referrer_id, v_l2_referrer_id);

  -- Create transaction record
  INSERT INTO transactions (sender_id, receiver_id, amount, note, transaction_type, status, sender_prev_balance, sender_new_balance)
  VALUES (p_buyer_id, v_instructor_id, p_amount, 'Course purchase', 'purchase', 'completed', v_buyer_balance, v_buyer_balance - p_amount);

  -- Create notifications
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES 
    (p_buyer_id, 'course', 'Course Purchased', 'You have enrolled in a new course!', jsonb_build_object('course_id', p_course_id, 'amount', p_amount)),
    (v_instructor_id, 'payment', 'Course Sale', 'Someone purchased your course! You earned ' || v_instructor_share || ' ETB.', jsonb_build_object('course_id', p_course_id, 'amount', v_instructor_share));

  -- Commission notifications
  IF v_l1_referrer_id IS NOT NULL AND v_l1_commission > 0 THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (v_l1_referrer_id, 'transaction', 'Referral Commission', 'You earned ' || v_l1_commission || ' ETB L1 commission from a referral purchase!', jsonb_build_object('amount', v_l1_commission, 'type', 'l1_commission'));
  END IF;
  
  IF v_l2_referrer_id IS NOT NULL AND v_l2_commission > 0 THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (v_l2_referrer_id, 'transaction', 'Level 2 Commission', 'You earned ' || v_l2_commission || ' ETB L2 commission!', jsonb_build_object('amount', v_l2_commission, 'type', 'l2_commission'));
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'instructor_share', v_instructor_share,
    'l1_commission', v_l1_commission,
    'l2_commission', v_l2_commission,
    'new_balance', v_buyer_balance - p_amount
  );
END;
$function$;

-- Trigger for updated_at
CREATE TRIGGER update_commission_groups_updated_at
BEFORE UPDATE ON public.commission_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
