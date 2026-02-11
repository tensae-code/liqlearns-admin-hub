
-- Create saved_messages table for "Saved Messages" feature (like Telegram)
CREATE TABLE public.saved_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  original_sender_name TEXT,
  original_timestamp TIMESTAMP WITH TIME ZONE,
  message_type TEXT NOT NULL DEFAULT 'text',
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_messages ENABLE ROW LEVEL SECURITY;

-- Users can only access their own saved messages
CREATE POLICY "Users can view own saved messages" ON public.saved_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved messages" ON public.saved_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved messages" ON public.saved_messages FOR DELETE USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_saved_messages_user_id ON public.saved_messages(user_id);
