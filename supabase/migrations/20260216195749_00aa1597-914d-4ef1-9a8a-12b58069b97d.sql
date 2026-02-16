
-- Remove the dangerous UPDATE policy that lets users set arbitrary wallet balances
DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;

-- Create a secure top-up function (placeholder for real payment gateway integration)
CREATE OR REPLACE FUNCTION public.top_up_wallet(p_user_id uuid, p_amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_balance numeric;
  v_new_balance numeric;
BEGIN
  -- Validate amount
  IF p_amount <= 0 OR p_amount > 100000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be between 1 and 100,000');
  END IF;

  -- Get and lock wallet
  SELECT balance INTO v_current_balance FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  
  IF v_current_balance IS NULL THEN
    INSERT INTO wallets (user_id, balance) VALUES (p_user_id, 0);
    v_current_balance := 0;
  END IF;

  v_new_balance := v_current_balance + p_amount;

  -- Update wallet
  UPDATE wallets
  SET balance = v_new_balance,
      total_earned = COALESCE(total_earned, 0) + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Create transaction record for audit
  INSERT INTO transactions (sender_id, receiver_id, amount, note, transaction_type, status, receiver_prev_balance, receiver_new_balance)
  VALUES (p_user_id, p_user_id, p_amount, 'Wallet top-up', 'top_up', 'completed', v_current_balance, v_new_balance);

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'previous_balance', v_current_balance
  );
END;
$$;
