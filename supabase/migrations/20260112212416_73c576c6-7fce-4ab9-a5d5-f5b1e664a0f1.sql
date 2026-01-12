-- Fix the infinite recursion in profiles RLS policy
-- The "Parents can view linked children profiles" policy joins back to profiles, causing recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Parents can view linked children profiles" ON public.profiles;

-- Create a fixed version that doesn't reference profiles table in the condition
-- Use auth.uid() directly with parent_children table
CREATE POLICY "Parents can view linked children profiles" 
ON public.profiles 
FOR SELECT 
TO public
USING (
  EXISTS (
    SELECT 1
    FROM parent_children pc
    WHERE pc.child_id = profiles.id 
    AND pc.parent_id IN (
      SELECT p.id FROM profiles p WHERE p.user_id = auth.uid()
    )
  )
);

-- Actually, this still has recursion. Let's use a simpler approach with a subquery on the parent_children table
DROP POLICY IF EXISTS "Parents can view linked children profiles" ON public.profiles;

-- Use the user_id from profiles to check if auth.uid matches a parent in parent_children
CREATE POLICY "Parents can view linked children profiles" 
ON public.profiles 
FOR SELECT 
TO public
USING (
  id IN (
    SELECT pc.child_id 
    FROM parent_children pc 
    INNER JOIN profiles parent_prof ON pc.parent_id = parent_prof.id
    WHERE parent_prof.user_id = auth.uid()
  )
);

-- This still has the issue. Let's restructure to avoid profiles reference entirely
-- We need a different approach - create a helper function

DROP POLICY IF EXISTS "Parents can view linked children profiles" ON public.profiles;

-- Create a security definer function that can bypass RLS to check parent-child relationship
CREATE OR REPLACE FUNCTION public.is_parent_of_profile(profile_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM parent_children pc
    INNER JOIN profiles p ON pc.parent_id = p.id
    WHERE pc.child_id = profile_id 
    AND p.user_id = auth.uid()
  );
$$;

-- Now create the policy using the function
CREATE POLICY "Parents can view linked children profiles" 
ON public.profiles 
FOR SELECT 
TO public
USING (public.is_parent_of_profile(id));