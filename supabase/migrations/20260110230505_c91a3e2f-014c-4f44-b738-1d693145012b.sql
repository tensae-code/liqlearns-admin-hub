-- Create parent-child relationship table
CREATE TABLE public.parent_children (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL,
  child_id UUID NOT NULL,
  relationship TEXT DEFAULT 'parent',
  nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parent_id, child_id)
);

-- Add foreign key constraints to profiles table
ALTER TABLE public.parent_children
  ADD CONSTRAINT parent_children_parent_id_fkey 
  FOREIGN KEY (parent_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.parent_children
  ADD CONSTRAINT parent_children_child_id_fkey 
  FOREIGN KEY (child_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;

-- Parents can view their linked children
CREATE POLICY "Parents can view their children"
ON public.parent_children
FOR SELECT
USING (parent_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Parents can link children
CREATE POLICY "Parents can link children"
ON public.parent_children
FOR INSERT
WITH CHECK (parent_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Parents can update their child links
CREATE POLICY "Parents can update their children"
ON public.parent_children
FOR UPDATE
USING (parent_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Parents can remove child links
CREATE POLICY "Parents can remove children"
ON public.parent_children
FOR DELETE
USING (parent_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));