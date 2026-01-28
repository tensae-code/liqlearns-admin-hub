-- Create a secure function to handle money transfers atomically
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
  v_sender_wallet wallets%ROWTYPE;
  v_receiver_wallet wallets%ROWTYPE;
  v_sender_new_balance numeric;
  v_receiver_new_balance numeric;
  v_transaction_id uuid;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;

  -- Validate sender is not receiver
  IF p_sender_id = p_receiver_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot send money to yourself');
  END IF;

  -- Get sender wallet with lock
  SELECT * INTO v_sender_wallet FROM wallets WHERE user_id = p_sender_id FOR UPDATE;
  
  -- Create sender wallet if not exists
  IF v_sender_wallet.id IS NULL THEN
    INSERT INTO wallets (user_id, balance, pending_balance, total_earned, total_spent)
    VALUES (p_sender_id, 0, 0, 0, 0)
    RETURNING * INTO v_sender_wallet;
  END IF;

  -- Check sufficient balance
  IF v_sender_wallet.balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Get or create receiver wallet with lock
  SELECT * INTO v_receiver_wallet FROM wallets WHERE user_id = p_receiver_id FOR UPDATE;
  
  IF v_receiver_wallet.id IS NULL THEN
    INSERT INTO wallets (user_id, balance, pending_balance, total_earned, total_spent)
    VALUES (p_receiver_id, 0, 0, 0, 0)
    RETURNING * INTO v_receiver_wallet;
  END IF;

  -- Calculate new balances
  v_sender_new_balance := v_sender_wallet.balance - p_amount;
  v_receiver_new_balance := v_receiver_wallet.balance + p_amount;

  -- Update sender wallet
  UPDATE wallets SET
    balance = v_sender_new_balance,
    total_spent = COALESCE(total_spent, 0) + p_amount,
    updated_at = now()
  WHERE user_id = p_sender_id;

  -- Update receiver wallet
  UPDATE wallets SET
    balance = v_receiver_new_balance,
    total_earned = COALESCE(total_earned, 0) + p_amount,
    updated_at = now()
  WHERE user_id = p_receiver_id;

  -- Create transaction record
  INSERT INTO transactions (
    sender_id, receiver_id, amount, note, transaction_type, status,
    sender_prev_balance, sender_new_balance, receiver_prev_balance, receiver_new_balance
  ) VALUES (
    p_sender_id, p_receiver_id, p_amount, p_note, 'transfer', 'completed',
    v_sender_wallet.balance, v_sender_new_balance, v_receiver_wallet.balance, v_receiver_new_balance
  ) RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'sender_new_balance', v_sender_new_balance,
    'receiver_new_balance', v_receiver_new_balance,
    'sender_prev_balance', v_sender_wallet.balance,
    'receiver_prev_balance', v_receiver_wallet.balance
  );
END;
$$;

-- Drop existing policies on wallets and create proper ones
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can insert their own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.wallets;

-- Users can view their own wallet
CREATE POLICY "Users can view own wallet"
ON public.wallets FOR SELECT
USING (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Users can insert their own wallet
CREATE POLICY "Users can insert own wallet"
ON public.wallets FOR INSERT
WITH CHECK (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Users can update their own wallet (for top-ups)
CREATE POLICY "Users can update own wallet"
ON public.wallets FOR UPDATE
USING (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));