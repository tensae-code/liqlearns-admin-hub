-- Create student_enterprise_memberships table (student can belong to multiple enterprises)
CREATE TABLE public.student_enterprise_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enterprise_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, enterprise_id)
);

-- Enable RLS
ALTER TABLE public.student_enterprise_memberships ENABLE ROW LEVEL SECURITY;

-- Students can view their own memberships
CREATE POLICY "Students can view own memberships"
ON public.student_enterprise_memberships
FOR SELECT
USING (student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Students can update their own pending memberships (accept/reject)
CREATE POLICY "Students can update own pending memberships"
ON public.student_enterprise_memberships
FOR UPDATE
USING (student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Enterprise users can view memberships for their enterprise
CREATE POLICY "Enterprise can view their memberships"
ON public.student_enterprise_memberships
FOR SELECT
USING (enterprise_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Enterprise users can insert invitations
CREATE POLICY "Enterprise can invite students"
ON public.student_enterprise_memberships
FOR INSERT
WITH CHECK (enterprise_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create function to enforce max 2 parents per child
CREATE OR REPLACE FUNCTION public.check_max_parents()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM parent_children WHERE child_id = NEW.child_id) >= 2 THEN
    RAISE EXCEPTION 'A child can have at most 2 parents linked';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to enforce parent limit
CREATE TRIGGER enforce_max_parents
BEFORE INSERT ON public.parent_children
FOR EACH ROW
EXECUTE FUNCTION public.check_max_parents();

-- Add realtime for memberships
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_enterprise_memberships;