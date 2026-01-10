-- Create brain_bank table for storing user's collected learning resources
CREATE TABLE public.brain_bank (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('vocabulary', 'note', 'flashcard', 'bookmark', 'quote')),
  title TEXT NOT NULL,
  content TEXT,
  translation TEXT,
  pronunciation TEXT,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  review_count INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brain_bank ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own brain bank items"
ON public.brain_bank
FOR SELECT
USING (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can insert their own brain bank items"
ON public.brain_bank
FOR INSERT
WITH CHECK (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can update their own brain bank items"
ON public.brain_bank
FOR UPDATE
USING (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can delete their own brain bank items"
ON public.brain_bank
FOR DELETE
USING (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_brain_bank_user_id ON public.brain_bank(user_id);
CREATE INDEX idx_brain_bank_type ON public.brain_bank(type);
CREATE INDEX idx_brain_bank_category ON public.brain_bank(category);

-- Trigger for updated_at
CREATE TRIGGER update_brain_bank_updated_at
BEFORE UPDATE ON public.brain_bank
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();