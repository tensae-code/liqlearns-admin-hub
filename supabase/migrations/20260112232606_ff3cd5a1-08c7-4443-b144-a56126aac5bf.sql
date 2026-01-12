-- Allow authenticated users to search and view other profiles (for messaging/social features)
-- This policy allows viewing basic profile info of other users
CREATE POLICY "Authenticated users can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (true);