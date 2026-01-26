-- Add claimed_by and claimed_at columns to courses table for admin claim functionality
ALTER TABLE public.courses 
ADD COLUMN claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN claimed_at timestamp with time zone;

-- Create index for faster lookups
CREATE INDEX idx_courses_claimed_by ON public.courses(claimed_by) WHERE claimed_by IS NOT NULL;