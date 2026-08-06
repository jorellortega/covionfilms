-- Migration: Cover image storage settings for covionfilms bucket

UPDATE storage.buckets
SET
  public = true,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
WHERE name = 'covionfilms';

-- Reinforce storage policies for cover uploads (safe to re-run)
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;

CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'covionfilms'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Allow authenticated users to update files" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'covionfilms'
    AND auth.uid() IS NOT NULL
  )
  WITH CHECK (
    bucket_id = 'covionfilms'
    AND auth.uid() IS NOT NULL
  );
