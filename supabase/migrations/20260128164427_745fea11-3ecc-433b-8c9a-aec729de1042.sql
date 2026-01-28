-- Drop and recreate transfer_money with SECURITY DEFINER to bypass RLS
DROP FUNCTION IF EXISTS public.transfer_money(uuid, uuid, numeric, text);

CREATE OR REPLACE FUNCTION public.transfer_money(
  p_sender_id uuid,
  p_receiver_id uuid,
  p_amount numeric,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_balance numeric;
  v_receiver_balance numeric;
  v_sender_new_balance numeric;
  v_receiver_new_balance numeric;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Check sender is not receiver
  IF p_sender_id = p_receiver_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot send money to yourself');
  END IF;

  -- Get sender wallet and lock it
  SELECT balance INTO v_sender_balance
  FROM wallets
  WHERE user_id = p_sender_id
  FOR UPDATE;

  IF v_sender_balance IS NULL THEN
    -- Create sender wallet if not exists
    INSERT INTO wallets (user_id, balance) VALUES (p_sender_id, 0);
    v_sender_balance := 0;
  END IF;

  -- Check sufficient balance
  IF v_sender_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Get or create receiver wallet
  SELECT balance INTO v_receiver_balance
  FROM wallets
  WHERE user_id = p_receiver_id
  FOR UPDATE;

  IF v_receiver_balance IS NULL THEN
    INSERT INTO wallets (user_id, balance) VALUES (p_receiver_id, 0);
    v_receiver_balance := 0;
  END IF;

  -- Calculate new balances
  v_sender_new_balance := v_sender_balance - p_amount;
  v_receiver_new_balance := v_receiver_balance + p_amount;

  -- Update sender wallet
  UPDATE wallets
  SET balance = v_sender_new_balance,
      total_spent = COALESCE(total_spent, 0) + p_amount,
      updated_at = now()
  WHERE user_id = p_sender_id;

  -- Update receiver wallet
  UPDATE wallets
  SET balance = v_receiver_new_balance,
      total_earned = COALESCE(total_earned, 0) + p_amount,
      updated_at = now()
  WHERE user_id = p_receiver_id;

  -- Create transaction record
  INSERT INTO transactions (
    sender_id, receiver_id, amount, note,
    transaction_type, status,
    sender_prev_balance, sender_new_balance,
    receiver_prev_balance, receiver_new_balance
  ) VALUES (
    p_sender_id, p_receiver_id, p_amount, p_note,
    'transfer', 'completed',
    v_sender_balance, v_sender_new_balance,
    v_receiver_balance, v_receiver_new_balance
  );

  RETURN jsonb_build_object(
    'success', true,
    'sender_prev_balance', v_sender_balance,
    'sender_new_balance', v_sender_new_balance,
    'receiver_prev_balance', v_receiver_balance,
    'receiver_new_balance', v_receiver_new_balance
  );
END;
$$;