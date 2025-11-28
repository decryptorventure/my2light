-- =====================================================
-- STORAGE BUCKET CREATION
-- Run this in Supabase SQL Editor to fix upload errors
-- =====================================================

-- 1. Create 'courts' bucket for court images
INSERT INTO storage.buckets (id, name, public)
VALUES ('courts', 'courts', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create 'avatars' bucket for user profiles
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Create 'videos' bucket for highlights
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- COURTS BUCKET POLICIES
-- Allow public read access
CREATE POLICY "Public Access Courts"
ON storage.objects FOR SELECT
USING ( bucket_id = 'courts' );

-- Allow authenticated users to upload court images
CREATE POLICY "Authenticated Upload Courts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'courts' );

-- AVATARS BUCKET POLICIES
CREATE POLICY "Public Access Avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

CREATE POLICY "Authenticated Upload Avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

-- VIDEOS BUCKET POLICIES
CREATE POLICY "Public Access Videos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'videos' );

CREATE POLICY "Authenticated Upload Videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'videos' );

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT * FROM storage.buckets;
