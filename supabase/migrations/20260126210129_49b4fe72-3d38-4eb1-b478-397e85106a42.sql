-- Add policy to allow viewing presentations for published courses (anyone can see)
-- This allows course preview without enrollment
CREATE POLICY "Anyone can view presentations for published courses" 
ON module_presentations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = module_presentations.course_id 
    AND courses.is_published = true
  )
);

-- Also add similar policy for course_resources to show resource counts on course cards
CREATE POLICY "Anyone can view resources for published courses" 
ON course_resources 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = course_resources.course_id 
    AND courses.is_published = true
  )
);