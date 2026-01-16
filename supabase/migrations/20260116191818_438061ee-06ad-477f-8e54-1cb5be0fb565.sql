-- Update the enterprise user's role to enterprise
UPDATE public.user_roles 
SET role = 'enterprise'::app_role 
WHERE user_id = (SELECT user_id FROM profiles WHERE email = 'enterprise@liqlearns.com');