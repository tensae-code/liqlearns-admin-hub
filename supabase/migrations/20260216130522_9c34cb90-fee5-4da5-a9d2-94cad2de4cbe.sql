
-- 1. Skill level content proposals review votes table
CREATE TABLE public.skill_level_review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.skill_edit_proposals(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('approve', 'reject')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(proposal_id, voter_id)
);

ALTER TABLE public.skill_level_review_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view votes" ON public.skill_level_review_votes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers can vote" ON public.skill_level_review_votes
  FOR INSERT TO authenticated WITH CHECK (
    voter_id = public.get_my_profile_id()
  );

CREATE POLICY "Voters can update own vote" ON public.skill_level_review_votes
  FOR UPDATE TO authenticated USING (voter_id = public.get_my_profile_id());

-- Trigger to update proposal vote counts  
CREATE TRIGGER update_proposal_votes_trigger
  AFTER INSERT OR UPDATE ON public.skill_level_review_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_proposal_votes();

-- 2. Teacher contribution points table
CREATE TABLE public.teacher_contribution_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  action_type TEXT NOT NULL, -- 'proposal_created', 'proposal_approved', 'review_vote', 'review_comment'
  reference_id UUID, -- proposal id or comment id
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.teacher_contribution_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own points" ON public.teacher_contribution_points
  FOR SELECT TO authenticated USING (teacher_id = public.get_my_profile_id());

CREATE POLICY "System can insert points" ON public.teacher_contribution_points
  FOR INSERT TO authenticated WITH CHECK (teacher_id = public.get_my_profile_id());

-- View for total points per teacher
CREATE OR REPLACE VIEW public.teacher_points_summary AS
SELECT teacher_id, SUM(points) as total_points, COUNT(*) as total_actions
FROM public.teacher_contribution_points
GROUP BY teacher_id;

-- 3. Platform settings table (CEO-configurable)
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.platform_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "CEO can update settings" ON public.platform_settings
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'ceo')
  );

CREATE POLICY "CEO can insert settings" ON public.platform_settings
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'ceo')
  );

-- Seed default settings
INSERT INTO public.platform_settings (key, value, description) VALUES
  ('skill_approval_threshold', '{"votes_required": 3}', 'Number of teacher votes required to auto-approve skill level content'),
  ('teacher_points_config', '{"proposal_created": 5, "review_vote": 2, "review_comment": 3, "proposal_approved": 10}', 'Points awarded for teacher contribution actions');

-- 4. Add skill_level_resources table for embedded resources in levels
CREATE TABLE public.skill_level_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_level_id UUID NOT NULL REFERENCES public.skill_levels(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- 'video', 'quiz', 'game', 'flashcard', 'audio', 'document'
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.skill_level_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view resources" ON public.skill_level_resources
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers can manage resources" ON public.skill_level_resources
  FOR ALL TO authenticated USING (created_by = public.get_my_profile_id())
  WITH CHECK (created_by = public.get_my_profile_id());

-- 5. Add proposal comments table for community discussion
CREATE TABLE public.skill_proposal_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.skill_edit_proposals(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.skill_proposal_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view comments" ON public.skill_proposal_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can add comments" ON public.skill_proposal_comments
  FOR INSERT TO authenticated WITH CHECK (author_id = public.get_my_profile_id());
