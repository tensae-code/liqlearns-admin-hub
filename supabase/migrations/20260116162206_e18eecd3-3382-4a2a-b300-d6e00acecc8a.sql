-- Create storage bucket for course resources (videos, audio)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-resources', 'course-resources', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for course resources
CREATE POLICY "Teachers can upload course resources"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-resources' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin', 'ceo')
  )
);

CREATE POLICY "Teachers can view their course resources"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-resources' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin', 'ceo', 'student')
  )
);

CREATE POLICY "Teachers can delete their course resources"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-resources' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin', 'ceo')
  )
);

-- Create table for course resources (videos, audio, quizzes, flashcards)
CREATE TABLE IF NOT EXISTS public.course_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  presentation_id UUID REFERENCES public.module_presentations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('video', 'audio', 'quiz', 'flashcard')),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_url TEXT,
  duration_seconds INTEGER,
  show_after_slide INTEGER NOT NULL DEFAULT 1,
  show_before_slide INTEGER NOT NULL DEFAULT 2,
  content JSONB DEFAULT '{}'::jsonb,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;

-- RLS policies for course_resources
CREATE POLICY "Teachers can manage their course resources"
ON public.course_resources FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = course_resources.course_id
    AND c.instructor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'ceo')
  )
);

CREATE POLICY "Students can view published course resources"
ON public.course_resources FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    WHERE e.course_id = course_resources.course_id
    AND e.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    AND c.is_published = true
  )
);

-- Create table for student presentation progress
CREATE TABLE IF NOT EXISTS public.presentation_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  presentation_id UUID NOT NULL REFERENCES public.module_presentations(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  current_slide INTEGER NOT NULL DEFAULT 1,
  slides_viewed INTEGER[] DEFAULT '{}',
  resources_completed UUID[] DEFAULT '{}',
  total_time_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, presentation_id)
);

-- Enable RLS
ALTER TABLE public.presentation_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for presentation_progress
CREATE POLICY "Users can manage their own progress"
ON public.presentation_progress FOR ALL
USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can view student progress"
ON public.presentation_progress FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = presentation_progress.course_id
    AND c.instructor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'ceo')
  )
);

-- Create table for quiz attempts on resources
CREATE TABLE IF NOT EXISTS public.resource_quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resource_id UUID NOT NULL REFERENCES public.course_resources(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT false,
  answers JSONB DEFAULT '[]'::jsonb,
  time_taken_seconds INTEGER,
  attempt_number INTEGER DEFAULT 1,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resource_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies for quiz attempts
CREATE POLICY "Users can manage their own quiz attempts"
ON public.resource_quiz_attempts FOR ALL
USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can view student quiz attempts"
ON public.resource_quiz_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM course_resources cr
    JOIN courses c ON c.id = cr.course_id
    WHERE cr.id = resource_quiz_attempts.resource_id
    AND c.instructor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'ceo')
  )
);