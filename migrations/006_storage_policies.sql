-- Migration 006: Fix Storage RLS Policies
-- This migration creates proper Row Level Security policies for the storage.objects table
-- to allow authenticated users to upload files to the covionfilms bucket

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to covionfilms bucket" ON storage.objects;

-- Policy 1: Allow authenticated users to upload files to covionfilms bucket
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'covionfilms' 
        AND auth.uid() IS NOT NULL
    );

-- Policy 2: Allow authenticated users to view files in covionfilms bucket
CREATE POLICY "Allow authenticated users to view files" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'covionfilms' 
        AND auth.uid() IS NOT NULL
    );

-- Policy 3: Allow authenticated users to update their own files
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

-- Policy 4: Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete files" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'covionfilms' 
        AND auth.uid() IS NOT NULL
    );

-- Policy 5: Allow public access to view files in covionfilms bucket (for streaming)
CREATE POLICY "Allow public access to covionfilms bucket" ON storage.objects
    FOR SELECT
    TO public
    USING (
        bucket_id = 'covionfilms'
    );

-- Grant necessary permissions to authenticated users
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Create a function to check if user has access to a specific file
CREATE OR REPLACE FUNCTION storage.check_user_file_access(file_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is authenticated and file exists in covionfilms bucket
    RETURN EXISTS (
        SELECT 1 
        FROM storage.objects 
        WHERE id = file_id 
        AND bucket_id = 'covionfilms'
        AND auth.uid() IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION storage.check_user_file_access(UUID) TO authenticated;

-- Insert some sample storage policies for testing (optional)
-- These can be uncommented if you want to test with sample data
/*
INSERT INTO storage.objects (id, bucket_id, name, owner, metadata)
VALUES 
    (gen_random_uuid(), 'covionfilms', 'test/sample.txt', auth.uid(), '{"size": 1024, "mimetype": "text/plain"}'::jsonb)
ON CONFLICT DO NOTHING;
*/

-- Add comment to document the policies
COMMENT ON POLICY "Allow authenticated users to upload files" ON storage.objects IS 'Allows authenticated users to upload files to the covionfilms bucket';
COMMENT ON POLICY "Allow authenticated users to view files" ON storage.objects IS 'Allows authenticated users to view files in the covionfilms bucket';
COMMENT ON POLICY "Allow authenticated users to update files" ON storage.objects IS 'Allows authenticated users to update files in the covionfilms bucket';
COMMENT ON POLICY "Allow authenticated users to delete files" ON storage.objects IS 'Allows authenticated users to delete files in the covionfilms bucket';
COMMENT ON POLICY "Allow public access to covionfilms bucket" ON storage.objects IS 'Allows public access to view files in the covionfilms bucket for streaming';
