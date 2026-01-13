-- Allow users to send DMs more freely for now (to any authenticated user)
-- This enables the app to work while proper friend/request systems are built out

DROP POLICY IF EXISTS "Users can send DMs" ON public.direct_messages;

CREATE POLICY "Users can send DMs"
ON public.direct_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND receiver_id IS NOT NULL
  AND sender_id != receiver_id
);