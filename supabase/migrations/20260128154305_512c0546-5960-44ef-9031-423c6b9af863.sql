-- Drop the previous policy and create one for CEO only
DROP POLICY IF EXISTS "CEO and Admin can update all profiles" ON public.profiles;

CREATE POLICY "CEO can update all profiles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'ceo'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'ceo'
  )
);