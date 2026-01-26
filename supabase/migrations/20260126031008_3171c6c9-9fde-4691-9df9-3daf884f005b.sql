-- Add lesson_breaks column to store lesson break metadata
ALTER TABLE public.module_presentations
ADD COLUMN IF NOT EXISTS lesson_breaks JSONB DEFAULT '[]'::jsonb;

-- Add a module_title column for custom module names
ALTER TABLE public.module_presentations
ADD COLUMN IF NOT EXISTS module_title TEXT;