-- Enable Storage
-- NOTE: You must create two public buckets named 'avatars' and 'highlights' in the Supabase Dashboard first!

-- 1. Policies for 'avatars' bucket
-- Allow public read access
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload their own avatar
-- (We assume the file name contains the user ID or we just allow auth users to upload)
CREATE POLICY "Anyone can upload an avatar"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid() = owner )
WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );

-- 2. Policies for 'highlights' bucket
-- Allow public read access
CREATE POLICY "Highlight videos are publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'highlights' );

-- Allow authenticated users to upload highlights
CREATE POLICY "Authenticated users can upload highlights"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'highlights' AND auth.role() = 'authenticated' );

-- Allow users to delete their own highlights
CREATE POLICY "Users can delete their own highlights"
ON storage.objects FOR DELETE
USING ( bucket_id = 'highlights' AND auth.uid() = owner );
