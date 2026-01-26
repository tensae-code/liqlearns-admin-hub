-- Add reply_to_id column to direct_messages for reply functionality
ALTER TABLE public.direct_messages 
ADD COLUMN reply_to_id uuid REFERENCES public.direct_messages(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_direct_messages_reply_to ON public.direct_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;