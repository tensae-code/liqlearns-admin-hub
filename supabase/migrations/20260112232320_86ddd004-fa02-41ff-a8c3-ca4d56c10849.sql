-- Drop the problematic policies on group_members
DROP POLICY IF EXISTS "Members can view group members" ON group_members;
DROP POLICY IF EXISTS "Admins can manage members" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave or admins can remove" ON group_members;

-- Create new policies that don't cause infinite recursion
-- Use direct user_id comparison instead of subquery on same table

-- View policy: Users can see members of groups they belong to
CREATE POLICY "Members can view group members" ON group_members
FOR SELECT USING (
  group_id IN (
    SELECT gm.group_id FROM group_members gm WHERE gm.user_id = auth.uid()
  )
);

-- Insert policy: Users can add themselves to groups (for joining)
CREATE POLICY "Users can join groups" ON group_members
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Delete policy: Users can remove themselves OR admins/owners can remove others
CREATE POLICY "Users can leave or admins can remove" ON group_members
FOR DELETE USING (
  user_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid() 
    AND gm.role IN ('owner', 'admin')
  )
);

-- Update policy: Admins/owners can update member roles
CREATE POLICY "Admins can manage members" ON group_members
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid() 
    AND gm.role IN ('owner', 'admin')
  )
);