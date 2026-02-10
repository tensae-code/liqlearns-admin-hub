
-- Create withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL DEFAULT 'telebirr', -- telebirr, bank_transfer, cbe
  account_info TEXT, -- phone number or bank account
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, completed
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own requests
CREATE POLICY "Users can view own withdrawal requests"
  ON public.withdrawal_requests FOR SELECT
  USING (user_id = public.get_my_profile_id());

-- Users can create their own withdrawal requests
CREATE POLICY "Users can create withdrawal requests"
  ON public.withdrawal_requests FOR INSERT
  WITH CHECK (user_id = public.get_my_profile_id());

-- CEO/admin can view all withdrawal requests
CREATE POLICY "CEO can view all withdrawal requests"
  ON public.withdrawal_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'admin'));

-- CEO can update withdrawal requests (approve/reject)
CREATE POLICY "CEO can update withdrawal requests"
  ON public.withdrawal_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'admin'));

-- Create course_purchases table
CREATE TABLE public.course_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  course_id UUID NOT NULL REFERENCES public.courses(id),
  instructor_id UUID REFERENCES public.profiles(id),
  amount NUMERIC NOT NULL,
  instructor_share NUMERIC NOT NULL DEFAULT 0,
  platform_share NUMERIC NOT NULL DEFAULT 0,
  l1_commission NUMERIC NOT NULL DEFAULT 0,
  l2_commission NUMERIC NOT NULL DEFAULT 0,
  l1_referrer_id UUID REFERENCES public.profiles(id),
  l2_referrer_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.course_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON public.course_purchases FOR SELECT
  USING (buyer_id = public.get_my_profile_id() OR instructor_id = public.get_my_profile_id());

CREATE POLICY "System can insert purchases"
  ON public.course_purchases FOR INSERT
  WITH CHECK (buyer_id = public.get_my_profile_id());

-- CEO can view all purchases
CREATE POLICY "CEO can view all purchases"
  ON public.course_purchases FOR SELECT
  USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'admin'));

-- Create the purchase_course function
CREATE OR REPLACE FUNCTION public.purchase_course(
  p_buyer_id UUID,
  p_course_id UUID,
  p_amount NUMERIC
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Get referral settings
  SELECT level1_percent, level2_percent, level2_cap 
  INTO v_l1_percent, v_l2_percent, v_l2_cap
  FROM referral_settings LIMIT 1;
  
  v_l1_percent := COALESCE(v_l1_percent, 15);
  v_l2_percent := COALESCE(v_l2_percent, 5);
  v_l2_cap := COALESCE(v_l2_cap, 50);

  -- Get referral chain
  SELECT sponsor_id INTO v_l1_referrer_id FROM profiles WHERE id = p_buyer_id;
  IF v_l1_referrer_id IS NOT NULL THEN
    SELECT sponsor_id INTO v_l2_referrer_id FROM profiles WHERE id = v_l1_referrer_id;
  END IF;

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
    
    -- Record referral reward
    INSERT INTO referral_rewards (earner_id, source_user_id, reward_type, amount, status)
    VALUES (v_l1_referrer_id, p_buyer_id, 'level1', v_l1_commission, 'paid');
    
    -- Update referral stats
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
$$;

-- Create process_withdrawal function for CEO approval
CREATE OR REPLACE FUNCTION public.process_withdrawal(
  p_request_id UUID,
  p_action TEXT, -- 'approve' or 'reject'
  p_reviewer_id UUID,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_user_balance NUMERIC;
BEGIN
  SELECT * INTO v_request FROM withdrawal_requests WHERE id = p_request_id;
  
  IF v_request IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;
  
  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request already processed');
  END IF;

  IF p_action = 'approve' THEN
    -- Check user balance
    SELECT balance INTO v_user_balance FROM wallets WHERE user_id = v_request.user_id FOR UPDATE;
    
    IF v_user_balance < v_request.amount THEN
      RETURN jsonb_build_object('success', false, 'error', 'User has insufficient balance');
    END IF;
    
    -- Deduct from wallet
    UPDATE wallets SET balance = balance - v_request.amount, total_spent = COALESCE(total_spent, 0) + v_request.amount, updated_at = now()
    WHERE user_id = v_request.user_id;
    
    -- Update request
    UPDATE withdrawal_requests SET status = 'approved', reviewed_by = p_reviewer_id, reviewed_at = now(), updated_at = now()
    WHERE id = p_request_id;
    
    -- Notify user
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (v_request.user_id, 'transaction', 'Withdrawal Approved', 'Your withdrawal of ' || v_request.amount || ' ETB has been approved and is being processed.', jsonb_build_object('amount', v_request.amount, 'method', v_request.method));
    
  ELSIF p_action = 'reject' THEN
    UPDATE withdrawal_requests SET status = 'rejected', reviewed_by = p_reviewer_id, reviewed_at = now(), rejection_reason = p_rejection_reason, updated_at = now()
    WHERE id = p_request_id;
    
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (v_request.user_id, 'transaction', 'Withdrawal Rejected', 'Your withdrawal request was rejected. Reason: ' || COALESCE(p_rejection_reason, 'No reason provided'), jsonb_build_object('amount', v_request.amount));
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Add realtime for withdrawal_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawal_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.course_purchases;

-- Add updated_at trigger
CREATE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
