-- Fix group_members RLS policy to work with profile IDs
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;

CREATE POLICY "Users can join groups" ON public.group_members
FOR INSERT WITH CHECK (
  user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
);

-- Also fix the is_group_member and is_group_admin functions to work properly
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members gm
    JOIN profiles p ON gm.user_id = p.id
    WHERE gm.group_id = p_group_id AND p.user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members gm
    JOIN profiles p ON gm.user_id = p.id
    WHERE gm.group_id = p_group_id 
    AND p.user_id = p_user_id 
    AND gm.role IN ('owner', 'admin')
  );
$$;