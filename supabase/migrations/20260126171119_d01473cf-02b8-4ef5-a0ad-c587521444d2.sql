-- Fix RLS policy for module_presentations to allow course instructors to view
-- Drop existing student view policy
DROP POLICY IF EXISTS "Students can view presentations for enrolled courses" ON public.module_presentations;

-- Create new policy that allows:
-- 1. Students enrolled in the course
-- 2. Course instructors (owner of the course)
-- 3. Admins/CEOs
CREATE POLICY "Users can view course presentations"
ON public.module_presentations FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    -- Teachers can see their own presentations
    uploaded_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    -- OR enrolled students can see
    OR EXISTS (
      SELECT 1 FROM enrollments e
      JOIN profiles p ON p.id = e.user_id
      WHERE p.user_id = auth.uid()
      AND e.course_id = module_presentations.course_id
    )
    -- OR course instructor can see
    OR EXISTS (
      SELECT 1 FROM courses c
      JOIN profiles p ON p.id = c.instructor_id
      WHERE c.id = module_presentations.course_id
      AND p.user_id = auth.uid()
    )
    -- OR admins/CEOs can see
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'ceo')
    )
  )
);