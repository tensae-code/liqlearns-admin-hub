
-- Game templates table for teacher-created interactive activities
CREATE TABLE public.game_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- bingo, memory, drag_drop, fill_blanks, tracing, word_search, recording, timer_challenge, quiz
  level TEXT, -- beginner, basics, advanced, pro
  sub_level TEXT, -- reading, speaking, writing, hearing
  config JSONB NOT NULL DEFAULT '{}', -- type-specific configuration (items, answers, options, etc.)
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false, -- if true, can be cloned by other teachers
  share_code TEXT UNIQUE, -- shareable link code for standalone assignments
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  course_id UUID REFERENCES public.courses(id),
  module_id TEXT, -- optional module association
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Game attempts/results tracking
CREATE TABLE public.game_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.game_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  score NUMERIC DEFAULT 0,
  max_score NUMERIC DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  attempt_data JSONB DEFAULT '{}', -- detailed attempt info (answers, recordings, etc.)
  attempt_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_attempts ENABLE ROW LEVEL SECURITY;

-- Game templates policies
CREATE POLICY "Teachers can manage their own game templates"
ON public.game_templates FOR ALL
USING (created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Published games are viewable by everyone"
ON public.game_templates FOR SELECT
USING (is_published = true);

-- Game attempts policies
CREATE POLICY "Users can create their own attempts"
ON public.game_attempts FOR INSERT
WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own attempts"
ON public.game_attempts FOR SELECT
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can view attempts for their games"
ON public.game_attempts FOR SELECT
USING (game_id IN (SELECT id FROM game_templates WHERE created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())));

-- Indexes
CREATE INDEX idx_game_templates_created_by ON public.game_templates(created_by);
CREATE INDEX idx_game_templates_type ON public.game_templates(type);
CREATE INDEX idx_game_templates_share_code ON public.game_templates(share_code);
CREATE INDEX idx_game_attempts_game_id ON public.game_attempts(game_id);
CREATE INDEX idx_game_attempts_user_id ON public.game_attempts(user_id);

-- Enable realtime for game attempts
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_attempts;
