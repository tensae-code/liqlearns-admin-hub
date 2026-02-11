
-- Fix pinned_messages RLS: allow any DM participant to pin/unpin, not just admins
DROP POLICY IF EXISTS "Admins can pin messages" ON pinned_messages;
DROP POLICY IF EXISTS "Admins can unpin messages" ON pinned_messages;
DROP POLICY IF EXISTS "Members can view pinned messages" ON pinned_messages;

-- SELECT: group members or DM participants
CREATE POLICY "Members can view pinned messages" ON pinned_messages
FOR SELECT USING (
  (channel_id IN (
    SELECT gc.id FROM group_channels gc
    JOIN group_members gm ON gc.group_id = gm.group_id
    JOIN profiles p ON gm.user_id = p.id
    WHERE p.user_id = auth.uid()
  ))
  OR
  (conversation_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles p WHERE p.user_id = auth.uid()
    AND pinned_messages.conversation_id LIKE '%' || p.id::text || '%'
  ))
);

-- INSERT: group admins/owners OR DM participants
CREATE POLICY "Users can pin messages" ON pinned_messages
FOR INSERT WITH CHECK (
  (channel_id IN (
    SELECT gc.id FROM group_channels gc
    JOIN group_members gm ON gc.group_id = gm.group_id
    JOIN profiles p ON gm.user_id = p.id
    WHERE p.user_id = auth.uid() AND gm.role IN ('owner', 'admin')
  ))
  OR
  (conversation_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles p WHERE p.user_id = auth.uid()
    AND pinned_messages.conversation_id LIKE '%' || p.id::text || '%'
  ))
);

-- DELETE: group admins/owners OR DM participants
CREATE POLICY "Users can unpin messages" ON pinned_messages
FOR DELETE USING (
  (channel_id IN (
    SELECT gc.id FROM group_channels gc
    JOIN group_members gm ON gc.group_id = gm.group_id
    JOIN profiles p ON gm.user_id = p.id
    WHERE p.user_id = auth.uid() AND gm.role IN ('owner', 'admin')
  ))
  OR
  (conversation_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles p WHERE p.user_id = auth.uid()
    AND pinned_messages.conversation_id LIKE '%' || p.id::text || '%'
  ))
);

-- Add nickname column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname text;
