-- Create storage bucket for course presentations
INSERT INTO storage.buckets (id, name, public)
VALUES ('presentations', 'presentations', false)
ON CONFLICT (id) DO NOTHING;

-- Create policies for presentations bucket
CREATE POLICY "Teachers can upload presentations"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'presentations' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin', 'ceo')
  )
);

CREATE POLICY "Teachers can update their presentations"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'presentations' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin', 'ceo')
  )
);

CREATE POLICY "Teachers can delete their presentations"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'presentations' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin', 'ceo')
  )
);

CREATE POLICY "Enrolled students can view presentations"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'presentations' 
  AND auth.uid() IS NOT NULL
);

-- Create table to store presentation metadata and parsed slides
CREATE TABLE IF NOT EXISTS public.module_presentations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  total_slides INTEGER NOT NULL DEFAULT 0,
  slide_data JSONB DEFAULT '[]'::jsonb,
  resources JSONB DEFAULT '[]'::jsonb,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on module_presentations
ALTER TABLE public.module_presentations ENABLE ROW LEVEL SECURITY;

-- RLS policies for module_presentations
CREATE POLICY "Teachers can manage their presentations"
ON public.module_presentations
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND (
    uploaded_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'ceo')
    )
  )
);

CREATE POLICY "Students can view presentations for enrolled courses"
ON public.module_presentations
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM enrollments e
    JOIN profiles p ON p.id = e.user_id
    WHERE p.user_id = auth.uid()
    AND e.course_id = module_presentations.course_id
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_module_presentations_updated_at
BEFORE UPDATE ON public.module_presentations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();