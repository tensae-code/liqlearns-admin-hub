-- Add birthday field to profiles for age-based dashboard routing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday date;

-- Create a view to help check if user is under 16
CREATE OR REPLACE VIEW public.profile_with_age AS
SELECT 
  *,
  CASE 
    WHEN birthday IS NOT NULL THEN DATE_PART('year', AGE(birthday))
    ELSE NULL
  END as age,
  CASE 
    WHEN birthday IS NOT NULL AND DATE_PART('year', AGE(birthday)) < 16 THEN true
    ELSE false
  END as is_underage
FROM public.profiles;