-- Drop ALL policies that reference the profiles table in their WHERE clause (causing recursion)
DROP POLICY IF EXISTS "Enterprise can view member profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view enrolled student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and CEOs can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Support staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Parents can view linked children profiles" ON public.profiles;

-- The simple policies remain (profiles_public_read, profiles_insert_own, profiles_update_own)
-- which don't have recursion issues