-- Fix pinned_messages INSERT policy to allow all authenticated users for DMs
-- The issue: conversation_id stores 'dm_<user_id>' but RLS checks profile.id
DROP POLICY IF EXISTS "Users can pin messages" ON public.pinned_messages;
CREATE POLICY "Users can pin messages" ON public.pinned_messages
FOR INSERT WITH CHECK (
  -- For group channels: any member can pin
  (channel_id IN (
    SELECT gc.id FROM group_channels gc
    JOIN group_members gm ON gc.group_id = gm.group_id
    JOIN profiles p ON gm.user_id = p.id
    WHERE p.user_id = auth.uid()
  ))
  OR
  -- For DMs: any participant can pin (check conversation_id contains either user_id or profile_id)
  (conversation_id IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND (
        pinned_messages.conversation_id LIKE ('%' || p.id::text || '%')
        OR pinned_messages.conversation_id LIKE ('%' || p.user_id::text || '%')
      )
    )
  ))
);

-- Also fix SELECT and DELETE policies similarly
DROP POLICY IF EXISTS "Members can view pinned messages" ON public.pinned_messages;
CREATE POLICY "Members can view pinned messages" ON public.pinned_messages
FOR SELECT USING (
  (channel_id IN (
    SELECT gc.id FROM group_channels gc
    JOIN group_members gm ON gc.group_id = gm.group_id
    JOIN profiles p ON gm.user_id = p.id
    WHERE p.user_id = auth.uid()
  ))
  OR
  (conversation_id IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND (
        pinned_messages.conversation_id LIKE ('%' || p.id::text || '%')
        OR pinned_messages.conversation_id LIKE ('%' || p.user_id::text || '%')
      )
    )
  ))
);

DROP POLICY IF EXISTS "Users can unpin messages" ON public.pinned_messages;
CREATE POLICY "Users can unpin messages" ON public.pinned_messages
FOR DELETE USING (
  (channel_id IN (
    SELECT gc.id FROM group_channels gc
    JOIN group_members gm ON gc.group_id = gm.group_id
    JOIN profiles p ON gm.user_id = p.id
    WHERE p.user_id = auth.uid()
  ))
  OR
  (conversation_id IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND (
        pinned_messages.conversation_id LIKE ('%' || p.id::text || '%')
        OR pinned_messages.conversation_id LIKE ('%' || p.user_id::text || '%')
      )
    )
  ))
);