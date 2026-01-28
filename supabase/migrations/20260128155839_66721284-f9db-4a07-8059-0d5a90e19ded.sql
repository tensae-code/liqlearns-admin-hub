-- Create wallets table
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  pending_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_earned DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_spent DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Users can view their own wallet
CREATE POLICY "Users can view their own wallet"
ON public.wallets FOR SELECT
USING (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Users can update their own wallet (for balance changes)
CREATE POLICY "Users can update their own wallet"
ON public.wallets FOR UPDATE
USING (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Users can create their own wallet
CREATE POLICY "Users can create their own wallet"
ON public.wallets FOR INSERT
WITH CHECK (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  note TEXT,
  transaction_type TEXT NOT NULL DEFAULT 'transfer',
  status TEXT NOT NULL DEFAULT 'completed',
  sender_prev_balance DECIMAL(12,2),
  sender_new_balance DECIMAL(12,2),
  receiver_prev_balance DECIMAL(12,2),
  receiver_new_balance DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users can view transactions they're part of
CREATE POLICY "Users can view their transactions"
ON public.transactions FOR SELECT
USING (
  sender_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
  OR receiver_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
);

-- Users can create transactions where they are the sender
CREATE POLICY "Users can create transactions as sender"
ON public.transactions FOR INSERT
WITH CHECK (sender_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Enable realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Update notifications policy to allow users to create notifications
DROP POLICY IF EXISTS "Service role can create notifications" ON public.notifications;

CREATE POLICY "Authenticated users can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for faster queries
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_transactions_sender_id ON public.transactions(sender_id);
CREATE INDEX idx_transactions_receiver_id ON public.transactions(receiver_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

-- Create function to initialize wallet when profile is created
CREATE OR REPLACE FUNCTION public.create_wallet_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0.00)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger for automatic wallet creation
CREATE TRIGGER create_wallet_after_profile
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_wallet_for_user();