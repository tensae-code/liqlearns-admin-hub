-- Quest Board System - Replacing Brain Bank Tab in Community
-- Questions with admin approval, hashtags, video/links support

-- Create quest_board_questions table
CREATE TABLE public.quest_board_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  link_url TEXT,
  hashtags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  views_count INTEGER DEFAULT 0,
  answers_count INTEGER DEFAULT 0,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quest_board_answers table
CREATE TABLE public.quest_board_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.quest_board_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  video_url TEXT,
  link_url TEXT,
  is_accepted BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user hashtag preferences table
CREATE TABLE public.user_hashtag_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hashtag TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, hashtag)
);

-- Trigger to update answers count
CREATE OR REPLACE FUNCTION public.update_question_answers_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE quest_board_questions SET answers_count = answers_count + 1 WHERE id = NEW.question_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE quest_board_questions SET answers_count = GREATEST(0, answers_count - 1) WHERE id = OLD.question_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_answers_count
  AFTER INSERT OR DELETE ON public.quest_board_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_question_answers_count();

-- Enable RLS
ALTER TABLE public.quest_board_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_board_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hashtag_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for quest_board_questions
CREATE POLICY "Anyone can view approved questions"
  ON public.quest_board_questions FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can view their own questions"
  ON public.quest_board_questions FOR SELECT
  USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all questions"
  ON public.quest_board_questions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Users can create questions"
  ON public.quest_board_questions FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own pending questions"
  ON public.quest_board_questions FOR UPDATE
  USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) AND status = 'pending');

CREATE POLICY "Admins can update any question"
  ON public.quest_board_questions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Users can delete their own questions"
  ON public.quest_board_questions FOR DELETE
  USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS policies for quest_board_answers
CREATE POLICY "Anyone can view answers to approved questions"
  ON public.quest_board_answers FOR SELECT
  USING (question_id IN (SELECT id FROM quest_board_questions WHERE status = 'approved'));

CREATE POLICY "Users can create answers"
  ON public.quest_board_answers FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own answers"
  ON public.quest_board_answers FOR UPDATE
  USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own answers"
  ON public.quest_board_answers FOR DELETE
  USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS policies for user_hashtag_preferences
CREATE POLICY "Users can manage their own preferences"
  ON public.user_hashtag_preferences FOR ALL
  USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Add course submission status column
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS submission_status TEXT DEFAULT 'draft' 
  CHECK (submission_status IN ('draft', 'submitted', 'approved', 'rejected'));
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Admin privileges table (CEO manages these)
CREATE TABLE public.admin_privileges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  privilege_type TEXT NOT NULL,
  granted BOOLEAN DEFAULT true,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(admin_user_id, privilege_type)
);

-- User hold status for temporary holds
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_on_hold BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hold_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS held_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS held_by UUID REFERENCES public.profiles(id);

-- Enable RLS for admin_privileges
ALTER TABLE public.admin_privileges ENABLE ROW LEVEL SECURITY;

-- Only CEO can manage admin privileges
CREATE POLICY "CEO can manage admin privileges"
  ON public.admin_privileges FOR ALL
  USING (public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Admins can view their own privileges"
  ON public.admin_privileges FOR SELECT
  USING (admin_user_id = auth.uid());

-- Enable realtime for quest board
ALTER PUBLICATION supabase_realtime ADD TABLE public.quest_board_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quest_board_answers;