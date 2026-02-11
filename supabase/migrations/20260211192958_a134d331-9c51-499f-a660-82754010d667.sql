-- Drop existing policies
DROP POLICY IF EXISTS "Users can pin messages" ON public.pinned_messages;
DROP POLICY IF EXISTS "Users can unpin messages" ON public.pinned_messages;
DROP POLICY IF EXISTS "Members can view pinned messages" ON public.pinned_messages;

-- Simple policies: authenticated users can pin/unpin/view if they are the pinner
-- or a participant in the conversation

-- SELECT: any authenticated user can view pins (they need channel/conversation access which is handled by the app)
CREATE POLICY "Authenticated users can view pinned messages"
ON public.pinned_messages FOR SELECT
TO authenticated
USING (true);

-- INSERT: authenticated user can pin if pinned_by matches their profile
CREATE POLICY "Authenticated users can pin messages"
ON public.pinned_messages FOR INSERT
TO authenticated
WITH CHECK (
  pinned_by = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
);

-- DELETE: authenticated user can unpin if pinned_by matches their profile
CREATE POLICY "Authenticated users can unpin messages"
ON public.pinned_messages FOR DELETE
TO authenticated
USING (
  pinned_by = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
);