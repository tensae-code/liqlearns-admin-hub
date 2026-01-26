-- Add storage policy to allow teachers to upload course images to avatars bucket
-- The course images are stored under 'course-images/' path in the avatars bucket

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their avatar" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload course images" ON storage.objects;

-- Allow anyone to view all files in avatars bucket (it's public)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
  AND (
    -- User avatars: path starts with their user_id
    (storage.foldername(name))[1] = auth.uid()::text
    -- Course images: path starts with 'course-images'
    OR (storage.foldername(name))[1] = 'course-images'
  )
);

-- Allow users to update their own files
CREATE POLICY "Users can update their files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (storage.foldername(name))[1] = 'course-images'
  )
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (storage.foldername(name))[1] = 'course-images'
  )
);