-- Table to store course review comments from approval team
CREATE TABLE public.course_review_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_review_comments ENABLE ROW LEVEL SECURITY;

-- Teachers can view comments on their courses
CREATE POLICY "Teachers can view comments on their courses"
ON public.course_review_comments
FOR SELECT
USING (
  course_id IN (
    SELECT id FROM courses WHERE instructor_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Admins and CEOs can view all comments
CREATE POLICY "Admins can view all review comments"
ON public.course_review_comments
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));

-- Admins and CEOs can create comments
CREATE POLICY "Admins can create review comments"
ON public.course_review_comments
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));

-- Admins and CEOs can view submitted courses
CREATE POLICY "Admins can view submitted courses"
ON public.courses
FOR SELECT
USING (
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'))
  AND submission_status IN ('submitted', 'approved', 'rejected')
);

-- Admins and CEOs can update course submission status
CREATE POLICY "Admins can update course status"
ON public.courses
FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));

-- Enable realtime for course review comments (for notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.course_review_comments;