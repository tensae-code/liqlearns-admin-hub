
-- Fix: Drop the SECURITY DEFINER view and recreate as SECURITY INVOKER
DROP VIEW IF EXISTS public.teacher_points_summary;

CREATE OR REPLACE VIEW public.teacher_points_summary 
WITH (security_invoker = true) AS
SELECT teacher_id, SUM(points) as total_points, COUNT(*) as total_actions
FROM public.teacher_contribution_points
GROUP BY teacher_id;
