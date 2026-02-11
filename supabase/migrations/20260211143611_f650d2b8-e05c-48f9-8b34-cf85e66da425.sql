
-- 1. Fix profiles: Drop the overly permissive public read policy
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;

-- 2. Create authenticated-only read policy (authenticated users can view profiles for messaging, leaderboards, etc.)
CREATE POLICY "authenticated_users_can_view_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 3. Fix message-attachments bucket: make it private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'message-attachments';

-- 4. Drop the overly permissive storage SELECT policy
DROP POLICY IF EXISTS "Anyone can view message attachments" ON storage.objects;

-- 5. Create authenticated-only storage policy for message attachments
CREATE POLICY "Authenticated users can view message attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-attachments' AND
  (
    -- Users can view files they uploaded
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Users can view files in DMs they participate in
    EXISTS (
      SELECT 1 FROM direct_messages dm
      WHERE dm.file_url LIKE '%' || storage.filename(name) || '%'
      AND (dm.sender_id = auth.uid() OR dm.receiver_id = auth.uid())
    )
    OR
    -- Users can view files in group channels they're members of
    EXISTS (
      SELECT 1 FROM group_messages gm
      JOIN group_channels gc ON gm.channel_id = gc.id
      JOIN group_members mem ON mem.group_id = gc.group_id
      JOIN profiles p ON mem.user_id = p.id
      WHERE gm.file_url LIKE '%' || storage.filename(name) || '%'
      AND p.user_id = auth.uid()
    )
  )
);

-- 6. Add upload policy for authenticated users (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Authenticated users can upload message attachments'
  ) THEN
    CREATE POLICY "Authenticated users can upload message attachments"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'message-attachments' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;
