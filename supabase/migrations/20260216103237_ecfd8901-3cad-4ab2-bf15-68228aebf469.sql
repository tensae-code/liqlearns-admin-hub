
-- Skill categories (e.g., Fishing, Cooking, Programming)
CREATE TABLE public.skill_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '📚',
  color TEXT DEFAULT '#6366f1',
  parent_id UUID REFERENCES public.skill_categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Skills within categories (e.g., under Fishing: Etiquette, Finding Places, Tools, Types of Fish)
CREATE TABLE public.skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.skill_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '⭐',
  max_level INTEGER NOT NULL DEFAULT 10,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_id, slug)
);

-- Skill levels (each level has specific content/classes)
CREATE TABLE public.skill_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  level_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  coin_cost INTEGER NOT NULL DEFAULT 5, -- coins needed to activate/unlock
  xp_reward INTEGER NOT NULL DEFAULT 100,
  content JSONB DEFAULT '{}'::jsonb, -- lesson content, resources, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(skill_id, level_number)
);

-- User skill progress
CREATE TABLE public.user_skill_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  current_level INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  is_max_level BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

-- Teacher skill edits (teachers propose edits to skill content)
CREATE TABLE public.skill_edit_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_level_id UUID NOT NULL REFERENCES public.skill_levels(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  proposed_content JSONB NOT NULL,
  proposed_title TEXT,
  proposed_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, under_review, approved, rejected
  review_votes_up INTEGER DEFAULT 0,
  review_votes_down INTEGER DEFAULT 0,
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Teacher peer review votes on proposals
CREATE TABLE public.skill_edit_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.skill_edit_proposals(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
  vote TEXT NOT NULL, -- 'approve' or 'reject'
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(proposal_id, reviewer_id)
);

-- Enable RLS
ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_edit_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_edit_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies - skill categories and skills are publicly readable
CREATE POLICY "Anyone can view skill categories" ON public.skill_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Anyone can view skill levels" ON public.skill_levels FOR SELECT USING (true);

-- User progress is private
CREATE POLICY "Users can view own progress" ON public.user_skill_progress FOR SELECT USING (user_id = public.get_my_profile_id());
CREATE POLICY "Users can insert own progress" ON public.user_skill_progress FOR INSERT WITH CHECK (user_id = public.get_my_profile_id());
CREATE POLICY "Users can update own progress" ON public.user_skill_progress FOR UPDATE USING (user_id = public.get_my_profile_id());

-- Edit proposals - teachers can create, anyone can view approved
CREATE POLICY "Anyone can view proposals" ON public.skill_edit_proposals FOR SELECT USING (true);
CREATE POLICY "Teachers can create proposals" ON public.skill_edit_proposals FOR INSERT WITH CHECK (author_id = public.get_my_profile_id());
CREATE POLICY "Authors can update own proposals" ON public.skill_edit_proposals FOR UPDATE USING (author_id = public.get_my_profile_id());

-- Reviews
CREATE POLICY "Anyone can view reviews" ON public.skill_edit_reviews FOR SELECT USING (true);
CREATE POLICY "Teachers can create reviews" ON public.skill_edit_reviews FOR INSERT WITH CHECK (reviewer_id = public.get_my_profile_id());

-- Trigger to count review votes
CREATE OR REPLACE FUNCTION public.update_proposal_votes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote = 'approve' THEN
      UPDATE skill_edit_proposals SET review_votes_up = review_votes_up + 1, updated_at = now() WHERE id = NEW.proposal_id;
    ELSE
      UPDATE skill_edit_proposals SET review_votes_down = review_votes_down + 1, updated_at = now() WHERE id = NEW.proposal_id;
    END IF;
    
    -- Auto-approve if 3+ approvals and no rejections
    UPDATE skill_edit_proposals 
    SET status = 'approved', reviewed_at = now()
    WHERE id = NEW.proposal_id 
    AND review_votes_up >= 3 
    AND review_votes_down = 0
    AND status = 'under_review';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_proposal_votes ON skill_edit_reviews;
CREATE TRIGGER trigger_update_proposal_votes
  AFTER INSERT ON skill_edit_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_proposal_votes();

-- Seed some example skill categories
INSERT INTO public.skill_categories (name, slug, description, icon, color) VALUES
  ('Languages', 'languages', 'Master new languages and communication', '🗣️', '#3b82f6'),
  ('Technology', 'technology', 'Programming, IT, and digital skills', '💻', '#8b5cf6'),
  ('Science', 'science', 'Natural sciences and experiments', '🔬', '#10b981'),
  ('Arts', 'arts', 'Creative and performing arts', '🎨', '#f59e0b'),
  ('Life Skills', 'life-skills', 'Practical everyday skills', '🎯', '#ef4444'),
  ('Sports', 'sports', 'Physical activities and athletics', '⚽', '#06b6d4');
