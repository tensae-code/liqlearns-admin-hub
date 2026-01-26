-- Fix course RLS policies: Make the "Anyone can view published courses" policy permissive
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;

-- Recreate as a PERMISSIVE policy (default behavior)
CREATE POLICY "Anyone can view published courses" 
ON courses 
FOR SELECT 
USING ((is_published = true) OR (instructor_id = ( SELECT profiles.id FROM profiles WHERE (profiles.user_id = auth.uid()))));