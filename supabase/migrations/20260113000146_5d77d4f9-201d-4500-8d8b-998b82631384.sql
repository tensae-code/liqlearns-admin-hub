-- Drop the old incorrect INSERT policy
DROP POLICY IF EXISTS "Users can send DMs to friends" ON public.direct_messages;

-- Create new policy that correctly uses user_id from auth
-- This allows users to send DMs if they are friends OR if there's an accepted message request
CREATE POLICY "Users can send DMs" 
ON public.direct_messages 
FOR INSERT 
WITH CHECK (
  sender_id = auth.uid() 
  AND (
    -- Check if they are friends
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted' 
      AND (
        (f.requester_id = auth.uid() AND f.addressee_id = direct_messages.receiver_id)
        OR (f.addressee_id = auth.uid() AND f.requester_id = direct_messages.receiver_id)
      )
    )
    OR
    -- Or check for accepted message request
    EXISTS (
      SELECT 1 FROM message_requests mr
      WHERE mr.status = 'accepted'
      AND (
        (mr.sender_id = auth.uid() AND mr.receiver_id = direct_messages.receiver_id)
        OR (mr.receiver_id = auth.uid() AND mr.sender_id = direct_messages.receiver_id)
      )
    )
  )
);

-- Also fix the SELECT policy to use auth.uid() directly
DROP POLICY IF EXISTS "Users can view their DMs" ON public.direct_messages;
CREATE POLICY "Users can view their DMs" 
ON public.direct_messages 
FOR SELECT 
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Fix the UPDATE policy too
DROP POLICY IF EXISTS "Receivers can mark DMs as read" ON public.direct_messages;
CREATE POLICY "Receivers can mark DMs as read" 
ON public.direct_messages 
FOR UPDATE 
USING (receiver_id = auth.uid());