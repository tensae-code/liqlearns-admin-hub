-- Create learning paths table for enterprises
CREATE TABLE public.learning_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enterprise_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT false,
  estimated_duration INTEGER, -- in hours
  difficulty TEXT DEFAULT 'intermediate',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create learning path courses junction table with order and prerequisites
CREATE TABLE public.learning_path_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  prerequisite_course_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create milestones for learning paths
CREATE TABLE public.learning_path_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  trigger_after_course_id UUID REFERENCES public.courses(id),
  trigger_at_progress_percent INTEGER,
  xp_reward INTEGER DEFAULT 0,
  badge_id UUID REFERENCES public.badges(id),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user progress for learning paths
CREATE TABLE public.learning_path_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  current_course_index INTEGER DEFAULT 0,
  completed_course_ids UUID[] DEFAULT '{}',
  completed_milestone_ids UUID[] DEFAULT '{}',
  progress_percent INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, learning_path_id)
);

-- Create enterprise analytics events table
CREATE TABLE public.enterprise_analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enterprise_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'course_start', 'course_complete', 'lesson_complete', 'login', 'time_spent'
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  learning_path_id UUID REFERENCES public.learning_paths(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for learning_paths
CREATE POLICY "Enterprise owners can manage their learning paths"
  ON public.learning_paths FOR ALL
  USING (enterprise_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Published learning paths are viewable by all"
  ON public.learning_paths FOR SELECT
  USING (is_published = true);

-- RLS policies for learning_path_courses
CREATE POLICY "Learning path courses inherit path permissions"
  ON public.learning_path_courses FOR ALL
  USING (learning_path_id IN (
    SELECT id FROM learning_paths WHERE enterprise_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Anyone can view published path courses"
  ON public.learning_path_courses FOR SELECT
  USING (learning_path_id IN (SELECT id FROM learning_paths WHERE is_published = true));

-- RLS policies for milestones
CREATE POLICY "Milestone owners can manage"
  ON public.learning_path_milestones FOR ALL
  USING (learning_path_id IN (
    SELECT id FROM learning_paths WHERE enterprise_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Anyone can view published milestones"
  ON public.learning_path_milestones FOR SELECT
  USING (learning_path_id IN (SELECT id FROM learning_paths WHERE is_published = true));

-- RLS policies for progress
CREATE POLICY "Users can manage their own progress"
  ON public.learning_path_progress FOR ALL
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Enterprise can view member progress"
  ON public.learning_path_progress FOR SELECT
  USING (learning_path_id IN (
    SELECT id FROM learning_paths WHERE enterprise_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  ));

-- RLS policies for analytics
CREATE POLICY "Enterprise can view their analytics"
  ON public.enterprise_analytics_events FOR SELECT
  USING (enterprise_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can insert analytics"
  ON public.enterprise_analytics_events FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_learning_paths_enterprise ON public.learning_paths(enterprise_id);
CREATE INDEX idx_learning_path_courses_path ON public.learning_path_courses(learning_path_id);
CREATE INDEX idx_learning_path_progress_user ON public.learning_path_progress(user_id);
CREATE INDEX idx_enterprise_analytics_enterprise ON public.enterprise_analytics_events(enterprise_id);
CREATE INDEX idx_enterprise_analytics_date ON public.enterprise_analytics_events(created_at);

-- Update timestamps trigger
CREATE TRIGGER update_learning_paths_updated_at
  BEFORE UPDATE ON public.learning_paths
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_path_progress_updated_at
  BEFORE UPDATE ON public.learning_path_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();