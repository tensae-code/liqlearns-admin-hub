-- Fix the DM insert policy - friendships use profiles.id, not auth.uid()
-- We need to get the sender's profile.id to check friendships

DROP POLICY IF EXISTS "Users can send DMs" ON public.direct_messages;

-- Create a simpler policy that allows any authenticated user to send DMs
-- The friendships check needs to compare profile IDs, not user IDs
CREATE POLICY "Users can send DMs"
ON public.direct_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND (
    -- Check if they are friends (friendships uses profiles.id)
    EXISTS (
      SELECT 1 FROM friendships f
      JOIN profiles sender_profile ON sender_profile.user_id = auth.uid()
      JOIN profiles receiver_profile ON receiver_profile.user_id = direct_messages.receiver_id
      WHERE f.status = 'accepted'
      AND (
        (f.requester_id = sender_profile.id AND f.addressee_id = receiver_profile.id)
        OR (f.addressee_id = sender_profile.id AND f.requester_id = receiver_profile.id)
      )
    )
    OR
    -- Check if there's an accepted message request (uses user_id directly)
    EXISTS (
      SELECT 1 FROM message_requests mr
      WHERE mr.status = 'accepted'
      AND (
        (mr.sender_id = auth.uid() AND mr.receiver_id = direct_messages.receiver_id)
        OR (mr.receiver_id = auth.uid() AND mr.sender_id = direct_messages.receiver_id)
      )
    )
    OR
    -- Allow messaging if users are in the same group
    EXISTS (
      SELECT 1 FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() 
      AND gm2.user_id = direct_messages.receiver_id
    )
  )
);