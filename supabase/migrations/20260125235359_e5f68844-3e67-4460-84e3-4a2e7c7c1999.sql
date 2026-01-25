-- Add pinned_message_id to group_channels for pinned messages
ALTER TABLE public.group_channels ADD COLUMN IF NOT EXISTS pinned_message_ids uuid[] DEFAULT '{}';

-- Add media options to group_messages
ALTER TABLE public.group_messages ADD COLUMN IF NOT EXISTS media_options jsonb DEFAULT '{}';

-- Add media options to direct_messages  
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS media_options jsonb DEFAULT '{}';

-- Create a pinned_messages table for better querying and multiple pins
CREATE TABLE IF NOT EXISTS public.pinned_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL,
  channel_id uuid REFERENCES public.group_channels(id) ON DELETE CASCADE,
  conversation_id text, -- For DMs: dm_{user_id}
  pinned_by uuid NOT NULL,
  pinned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id)
);

-- Enable RLS on pinned_messages
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;

-- Members can view pinned messages in their channels
CREATE POLICY "Members can view pinned messages" ON public.pinned_messages
  FOR SELECT USING (
    (channel_id IN (
      SELECT gc.id FROM group_channels gc
      JOIN group_members gm ON gc.group_id = gm.group_id
      JOIN profiles p ON gm.user_id = p.id
      WHERE p.user_id = auth.uid()
    ))
    OR 
    (conversation_id LIKE 'dm_%' AND (
      conversation_id LIKE '%' || auth.uid()::text || '%'
    ))
  );

-- Admins and message senders can pin messages in groups
CREATE POLICY "Admins can pin messages" ON public.pinned_messages
  FOR INSERT WITH CHECK (
    (channel_id IN (
      SELECT gc.id FROM group_channels gc
      JOIN group_members gm ON gc.group_id = gm.group_id
      JOIN profiles p ON gm.user_id = p.id
      WHERE p.user_id = auth.uid() AND gm.role IN ('owner', 'admin')
    ))
    OR
    (conversation_id LIKE 'dm_%')
  );

-- Admins can unpin messages
CREATE POLICY "Admins can unpin messages" ON public.pinned_messages
  FOR DELETE USING (
    (channel_id IN (
      SELECT gc.id FROM group_channels gc
      JOIN group_members gm ON gc.group_id = gm.group_id
      JOIN profiles p ON gm.user_id = p.id
      WHERE p.user_id = auth.uid() AND gm.role IN ('owner', 'admin')
    ))
    OR
    (conversation_id LIKE 'dm_%')
  );

-- Enable realtime for pinned_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.pinned_messages;