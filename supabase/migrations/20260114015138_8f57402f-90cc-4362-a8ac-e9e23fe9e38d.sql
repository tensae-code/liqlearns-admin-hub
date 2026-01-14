-- Create skill suggestions table with admin approval workflow
CREATE TABLE public.skill_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'voting', 'approved', 'rejected', 'in_development')),
  votes_up INTEGER NOT NULL DEFAULT 0,
  votes_down INTEGER NOT NULL DEFAULT 0,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  voting_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create skill suggestion votes table
CREATE TABLE public.skill_suggestion_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_id UUID NOT NULL REFERENCES public.skill_suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(suggestion_id, user_id)
);

-- Enable RLS
ALTER TABLE public.skill_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_suggestion_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skill_suggestions
-- Anyone can view approved/voting/in_development suggestions
CREATE POLICY "Anyone can view public suggestions"
  ON public.skill_suggestions
  FOR SELECT
  USING (status IN ('voting', 'approved', 'in_development'));

-- Users can view their own pending suggestions
CREATE POLICY "Users can view their own suggestions"
  ON public.skill_suggestions
  FOR SELECT
  USING (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Admins can view all suggestions
CREATE POLICY "Admins can view all suggestions"
  ON public.skill_suggestions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));

-- Users can submit suggestions (starts as pending for admin approval)
CREATE POLICY "Users can submit suggestions"
  ON public.skill_suggestions
  FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Admins can update suggestions (approve/reject)
CREATE POLICY "Admins can update suggestions"
  ON public.skill_suggestions
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));

-- Users can delete their own pending suggestions
CREATE POLICY "Users can delete their pending suggestions"
  ON public.skill_suggestions
  FOR DELETE
  USING (
    user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
    AND status = 'pending'
  );

-- RLS Policies for skill_suggestion_votes
-- Anyone can view votes
CREATE POLICY "Anyone can view votes"
  ON public.skill_suggestion_votes
  FOR SELECT
  USING (true);

-- Users can vote on voting suggestions
CREATE POLICY "Users can vote"
  ON public.skill_suggestion_votes
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM skill_suggestions 
      WHERE id = suggestion_id AND status = 'voting'
    )
  );

-- Users can change their vote
CREATE POLICY "Users can update their vote"
  ON public.skill_suggestion_votes
  FOR UPDATE
  USING (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Users can remove their vote
CREATE POLICY "Users can remove their vote"
  ON public.skill_suggestion_votes
  FOR DELETE
  USING (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Create trigger to update vote counts
CREATE OR REPLACE FUNCTION update_skill_suggestion_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE skill_suggestions SET votes_up = votes_up + 1, updated_at = now() WHERE id = NEW.suggestion_id;
    ELSE
      UPDATE skill_suggestions SET votes_down = votes_down + 1, updated_at = now() WHERE id = NEW.suggestion_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE skill_suggestions SET votes_up = GREATEST(0, votes_up - 1), updated_at = now() WHERE id = OLD.suggestion_id;
    ELSE
      UPDATE skill_suggestions SET votes_down = GREATEST(0, votes_down - 1), updated_at = now() WHERE id = OLD.suggestion_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'up' AND NEW.vote_type = 'down' THEN
      UPDATE skill_suggestions SET votes_up = GREATEST(0, votes_up - 1), votes_down = votes_down + 1, updated_at = now() WHERE id = NEW.suggestion_id;
    ELSIF OLD.vote_type = 'down' AND NEW.vote_type = 'up' THEN
      UPDATE skill_suggestions SET votes_down = GREATEST(0, votes_down - 1), votes_up = votes_up + 1, updated_at = now() WHERE id = NEW.suggestion_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_skill_vote_change
AFTER INSERT OR UPDATE OR DELETE ON public.skill_suggestion_votes
FOR EACH ROW EXECUTE FUNCTION update_skill_suggestion_votes();

-- Create trigger for updated_at
CREATE TRIGGER update_skill_suggestions_updated_at
BEFORE UPDATE ON public.skill_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();