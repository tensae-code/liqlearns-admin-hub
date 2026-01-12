-- Fix the security definer view issue - recreate as SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = on) AS
SELECT 
  id, 
  user_id,
  full_name, 
  username, 
  avatar_url, 
  bio,
  xp_points,
  current_streak
FROM public.profiles;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;