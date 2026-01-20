-- SECURITY FIX: Remove overly permissive policy that exposes all user profiles
-- This policy allows ANY authenticated user to read ALL profiles including:
-- emails, phone numbers, birthdays, subscription details - CRITICAL PRIVACY VIOLATION

DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- The application will continue working because:
-- 1. "Users can view own profile" policy already exists (auth.uid() = user_id)
-- 2. "Parents can view linked children profiles" policy exists (is_parent_of_profile(id))
-- 3. The public_profiles view provides safe public access for social features

-- Add a policy for admins/CEOs to view all profiles for management purposes
CREATE POLICY "Admins and CEOs can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'ceo')
  )
);

-- Add a policy for support staff to view profiles for ticket resolution
CREATE POLICY "Support staff can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'support'
  )
);

-- Add a policy for teachers to view profiles of students enrolled in their courses
CREATE POLICY "Teachers can view enrolled student profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'teacher'
  )
  AND
  EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.courses c ON c.id = e.course_id
    WHERE e.user_id = profiles.id
    AND c.instructor_id = (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid())
  )
);

-- Add a policy for enterprise users to view members in their organization
CREATE POLICY "Enterprise can view member profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_enterprise_memberships sem
    WHERE sem.student_id = profiles.id
    AND sem.enterprise_id = (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid())
    AND sem.status = 'active'
  )
);