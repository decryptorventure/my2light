-- Migration 012: Create raw_segments storage bucket and policies
-- This bucket stores temporary video segments before merging

-- Create the bucket (run this in Supabase Dashboard > Storage)
-- Bucket name: raw_segments
-- Public: true
-- File size limit: 100MB
-- Allowed MIME types: video/webm, video/mp4

-- Note: Create the bucket manually in Supabase Dashboard first, then run the policies below

-- Storage Policies for raw_segments bucket
-- Allow authenticated users to upload their own segments
CREATE POLICY "Users can upload own segments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'raw_segments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own segments
CREATE POLICY "Users can read own segments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'raw_segments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own segments
CREATE POLICY "Users can delete own segments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'raw_segments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own segments
CREATE POLICY "Users can update own segments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'raw_segments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
