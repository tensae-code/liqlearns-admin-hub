ALTER TABLE public.user_messaging_settings 
ADD COLUMN IF NOT EXISTS show_name BOOLEAN NOT NULL DEFAULT true;