-- 1. Drop the profile_with_age view that exposes children's ages and personal data
DROP VIEW IF EXISTS public.profile_with_age;

-- 2. Tighten course_purchases: ensure referrers can also see their own commission data
-- Current policies are adequate (buyer/instructor can see own, CEO/admin can see all)
-- Add explicit policy for L1/L2 referrers to see their referral purchases
CREATE POLICY "Referrers can view their referral purchases"
ON public.course_purchases
FOR SELECT
TO authenticated
USING (
  l1_referrer_id = get_my_profile_id() 
  OR l2_referrer_id = get_my_profile_id()
);