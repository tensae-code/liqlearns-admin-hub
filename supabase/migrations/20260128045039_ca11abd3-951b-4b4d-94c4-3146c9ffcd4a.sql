-- Fix permissive RLS policy on referral_rewards
-- Replace the overly permissive insert policy with a proper one

DROP POLICY IF EXISTS "System can insert rewards" ON public.referral_rewards;

-- Only allow inserts from admins/ceo or through edge functions (service role)
CREATE POLICY "Admins can insert rewards"
  ON public.referral_rewards FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));