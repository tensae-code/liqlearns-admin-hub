-- Add gallery_images column to courses table for slideshow
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}'::TEXT[];

-- Add comment
COMMENT ON COLUMN public.courses.gallery_images IS 'Array of image URLs for course preview slideshow';
