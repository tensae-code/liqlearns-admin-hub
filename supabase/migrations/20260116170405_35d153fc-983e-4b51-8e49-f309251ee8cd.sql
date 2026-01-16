-- Fix permissive RLS policy for enterprise_analytics_events
-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "System can insert analytics" ON public.enterprise_analytics_events;

-- Create a more secure insert policy - only allow users to insert their own events
CREATE POLICY "Users can insert analytics events"
  ON public.enterprise_analytics_events FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR 
    enterprise_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );