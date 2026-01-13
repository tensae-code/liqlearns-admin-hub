-- Fix infinite recursion in group_members RLS policies
-- The issue is that policies are querying the same table they're protecting

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave or admins can remove" ON public.group_members;

-- Create a security definer function to check group membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

-- Create a security definer function to check if user is admin/owner
CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = p_group_id 
    AND user_id = p_user_id 
    AND role IN ('owner', 'admin')
  );
$$;

-- Recreate policies using the security definer functions
CREATE POLICY "Members can view group members" 
ON public.group_members 
FOR SELECT 
USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Users can join groups" 
ON public.group_members 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage members" 
ON public.group_members 
FOR UPDATE 
USING (public.is_group_admin(group_id, auth.uid()));

CREATE POLICY "Users can leave or admins can remove" 
ON public.group_members 
FOR DELETE 
USING (user_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));