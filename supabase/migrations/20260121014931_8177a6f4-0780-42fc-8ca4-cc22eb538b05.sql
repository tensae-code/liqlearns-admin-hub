-- Allow anyone to read public profile fields for username/sponsor validation
CREATE POLICY "Anyone can view public profile fields"
ON public.profiles
FOR SELECT
USING (true);

-- Allow public read access to user_roles for sponsor role validation  
CREATE POLICY "Anyone can view user roles"
ON public.user_roles
FOR SELECT
USING (true);