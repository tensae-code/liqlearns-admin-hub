-- Fix 1: Replace overly permissive profile SELECT policy with owner-only access
-- Also create a public_profiles view for safe public access (e.g., instructor listings, search)

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can only view their own profile by default
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Create a view for public profile information (safe fields only)
CREATE OR REPLACE VIEW public.public_profiles AS
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

-- Fix 2: Add explicit INSERT policy for notifications (service role only)
-- This makes the intent clear - only backend services can create notifications
CREATE POLICY "Service role can create notifications" ON public.notifications
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Fix 3: Add policy for parents to view their linked children's profiles
-- This is needed for the parent dashboard to work
CREATE POLICY "Parents can view linked children profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      JOIN public.profiles parent_profile ON pc.parent_id = parent_profile.id
      WHERE pc.child_id = profiles.id 
      AND parent_profile.user_id = auth.uid()
    )
  );