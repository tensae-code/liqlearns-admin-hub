-- First drop the problematic policy that's causing infinite recursion
DROP POLICY IF EXISTS "Anyone can view public profile fields" ON public.profiles;

-- Drop any existing "Users can view their own profile" policy that might conflict
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a simple non-recursive policy for public read access on profiles
-- This allows anyone (authenticated or not) to read profiles without recursion
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);