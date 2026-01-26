-- Fix RLS policy for module_presentations to allow teachers to INSERT
-- Drop the existing policy that's missing WITH CHECK
DROP POLICY IF EXISTS "Teachers can manage their presentations" ON public.module_presentations;

-- Create a proper policy with WITH CHECK for inserts
CREATE POLICY "Teachers can manage their presentations"
ON public.module_presentations FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND (
    uploaded_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'ceo')
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    uploaded_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'ceo')
    )
  )
);