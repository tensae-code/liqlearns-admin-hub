-- Drop the security definer view and recreate it with SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.profile_with_age;

-- Recreate without SECURITY DEFINER (uses INVOKER by default which respects RLS)
CREATE VIEW public.profile_with_age 
WITH (security_invoker = true)
AS
SELECT 
  *,
  CASE 
    WHEN birthday IS NOT NULL THEN DATE_PART('year', AGE(birthday))
    ELSE NULL
  END as age,
  CASE 
    WHEN birthday IS NOT NULL AND DATE_PART('year', AGE(birthday)) < 16 THEN true
    ELSE false
  END as is_underage
FROM public.profiles;