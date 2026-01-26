-- Create table for course badge name suggestions
CREATE TABLE public.course_badge_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  suggested_by UUID NOT NULL,
  suggested_name TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('teacher', 'student', 'admin')),
  votes_count INTEGER NOT NULL DEFAULT 0,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_badge_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view badge suggestions"
  ON public.course_badge_suggestions FOR SELECT
  USING (true);

CREATE POLICY "Users can add badge suggestions"
  ON public.course_badge_suggestions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = suggested_by AND user_id = auth.uid())
  );

CREATE POLICY "Admin/CEO can update badge suggestions"
  ON public.course_badge_suggestions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'ceo')
    )
  );

-- Add badge_name column to courses for approved badge
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS badge_name TEXT;

-- Index for faster lookups
CREATE INDEX idx_course_badge_suggestions_course ON public.course_badge_suggestions(course_id);