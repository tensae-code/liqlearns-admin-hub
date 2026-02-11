-- Drop existing policies
DROP POLICY IF EXISTS "Users can pin messages" ON public.pinned_messages;
DROP POLICY IF EXISTS "Users can unpin messages" ON public.pinned_messages;
DROP POLICY IF EXISTS "Members can view pinned messages" ON public.pinned_messages;

-- Recreate with fixed logic for DMs
-- For DMs: conversation_id = 'dm_<partnerProfileId>', so we need to check
-- that the current user has exchanged DMs with that partner
CREATE POLICY "Members can view pinned messages"
ON public.pinned_messages FOR SELECT
TO authenticated
USING (
  (channel_id IN (
    SELECT gc.id FROM group_channels gc
    JOIN group_members gm ON gc.group_id = gm.group_id
    JOIN profiles p ON gm.user_id = p.id
    WHERE p.user_id = auth.uid()
  ))
  OR
  (conversation_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND (
      -- Current user is the partner referenced in conversation_id
      pinned_messages.conversation_id = 'dm_' || p.id::text
      OR
      -- Current user sent/received DMs with the partner in conversation_id
      EXISTS (
        SELECT 1 FROM direct_messages dm
        WHERE (dm.sender_id = p.id OR dm.receiver_id = p.id)
        AND (
          dm.sender_id::text = replace(pinned_messages.conversation_id, 'dm_', '')
          OR dm.receiver_id::text = replace(pinned_messages.conversation_id, 'dm_', '')
        )
      )
    )
  ))
);

CREATE POLICY "Users can pin messages"
ON public.pinned_messages FOR INSERT
TO authenticated
WITH CHECK (
  (channel_id IN (
    SELECT gc.id FROM group_channels gc
    JOIN group_members gm ON gc.group_id = gm.group_id
    JOIN profiles p ON gm.user_id = p.id
    WHERE p.user_id = auth.uid()
  ))
  OR
  (conversation_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND (
      pinned_messages.conversation_id = 'dm_' || p.id::text
      OR
      EXISTS (
        SELECT 1 FROM direct_messages dm
        WHERE (dm.sender_id = p.id OR dm.receiver_id = p.id)
        AND (
          dm.sender_id::text = replace(pinned_messages.conversation_id, 'dm_', '')
          OR dm.receiver_id::text = replace(pinned_messages.conversation_id, 'dm_', '')
        )
      )
    )
  ))
);

CREATE POLICY "Users can unpin messages"
ON public.pinned_messages FOR DELETE
TO authenticated
USING (
  (channel_id IN (
    SELECT gc.id FROM group_channels gc
    JOIN group_members gm ON gc.group_id = gm.group_id
    JOIN profiles p ON gm.user_id = p.id
    WHERE p.user_id = auth.uid()
  ))
  OR
  (conversation_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND (
      pinned_messages.conversation_id = 'dm_' || p.id::text
      OR
      EXISTS (
        SELECT 1 FROM direct_messages dm
        WHERE (dm.sender_id = p.id OR dm.receiver_id = p.id)
        AND (
          dm.sender_id::text = replace(pinned_messages.conversation_id, 'dm_', '')
          OR dm.receiver_id::text = replace(pinned_messages.conversation_id, 'dm_', '')
        )
      )
    )
  ))
);