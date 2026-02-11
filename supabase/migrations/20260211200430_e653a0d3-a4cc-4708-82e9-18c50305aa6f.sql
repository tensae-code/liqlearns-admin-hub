
-- Create user messaging settings table
CREATE TABLE public.user_messaging_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  font_size INTEGER NOT NULL DEFAULT 14,
  show_status BOOLEAN NOT NULL DEFAULT true,
  show_activity BOOLEAN NOT NULL DEFAULT true,
  show_avatar BOOLEAN NOT NULL DEFAULT true,
  accept_non_friends BOOLEAN NOT NULL DEFAULT true,
  messages_before_accept INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_messaging_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own settings
CREATE POLICY "Users can view own messaging settings"
ON public.user_messaging_settings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert own messaging settings"
ON public.user_messaging_settings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own messaging settings"
ON public.user_messaging_settings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_user_messaging_settings_updated_at
BEFORE UPDATE ON public.user_messaging_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_messaging_settings;

-- Add RLS policy for users to delete their own messages (DM)
CREATE POLICY "Users can delete own direct messages"
ON public.direct_messages FOR DELETE
TO authenticated
USING (sender_id = auth.uid());

-- Add RLS policy for users to delete own group messages (using profile id)
CREATE POLICY "Users can delete own group messages"
ON public.group_messages FOR DELETE
TO authenticated
USING (sender_id = public.get_my_profile_id());
