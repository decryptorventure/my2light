-- my2light Supabase Database Schema Setup
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    avatar TEXT,
    phone TEXT,
    total_highlights INTEGER DEFAULT 0,
    credits INTEGER DEFAULT 0,
    membership_tier TEXT DEFAULT 'free' CHECK (membership_tier IN ('free', 'pro', 'elite')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. COURTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS courts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('live', 'busy', 'available', 'maintenance')),
    thumbnail_url TEXT,
    price_per_hour INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read courts
CREATE POLICY "Anyone can view courts" ON courts
    FOR SELECT USING (true);

-- Insert sample courts
INSERT INTO courts (id, name, address, status, thumbnail_url, price_per_hour) VALUES
('c1', 'CLB Pickleball Cầu Giấy', '123 Đường Cầu Giấy, Hà Nội', 'live', 'https://images.unsplash.com/photo-1626248584912-2550cb5a6b0c?q=80&w=800&auto=format&fit=crop', 150000),
('c2', 'Sân Tennis Thành Phố', '45 Đường Tây Hồ, Hà Nội', 'available', 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=800&auto=format&fit=crop', 200000),
('c3', 'Sân Cầu Lông Ciputra', 'Khu Đô Thị Ciputra, Hà Nội', 'busy', 'https://images.unsplash.com/photo-1546519638-68e109498ee3?q=80&w=800&auto=format&fit=crop', 100000)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. PACKAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    is_best_value BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read packages
CREATE POLICY "Anyone can view packages" ON packages
    FOR SELECT USING (true);

-- Insert sample packages
INSERT INTO packages (id, name, duration_minutes, price, description, is_best_value) VALUES
('p1', 'Giao Hữu Nhanh', 60, 30000, 'Phù hợp khởi động hoặc chơi nhanh', false),
('p2', 'Trận Đấu Pro', 120, 50000, 'Gói tiêu chuẩn cho trận đấu đầy đủ', true),
('p3', 'Marathon Thể Lực', 180, 70000, 'Dành cho những chiến binh bền bỉ', false),
('p4', 'Gói Quay Cả Trận', 90, 100000, 'Ghi hình toàn bộ 90 phút Full HD. Tải về qua Wifi tại sân.', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. BOOKINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    court_id TEXT REFERENCES courts(id) NOT NULL,
    package_id TEXT REFERENCES packages(id) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    total_amount INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 5. HIGHLIGHTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS highlights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    court_id TEXT REFERENCES courts(id) NOT NULL,
    thumbnail_url TEXT,
    video_url TEXT,
    duration_sec INTEGER DEFAULT 30,
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for highlights
CREATE POLICY "Anyone can view highlights" ON highlights
    FOR SELECT USING (true);

CREATE POLICY "Users can create own highlights" ON highlights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own highlights" ON highlights
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 6. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. AUTO-CREATE PROFILE ON SIGNUP
-- =====================================================
-- This function automatically creates a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, avatar)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- DONE! Your database is ready.
-- =====================================================
-- =====================================================
-- COMPLETE RLS POLICY FIX
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. DROP ALL EXISTING POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

-- =====================================================
-- 2. CREATE CORRECT POLICIES FOR PROFILES
-- =====================================================

-- Allow authenticated users to INSERT their own profile
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to UPDATE their own profile
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to SELECT their own profile
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

-- =====================================================
-- 3. FIX BOOKINGS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;

CREATE POLICY "bookings_select_policy" ON bookings
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "bookings_insert_policy" ON bookings
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookings_update_policy" ON bookings
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 4. FIX HIGHLIGHTS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "View public or own highlights" ON highlights;
DROP POLICY IF EXISTS "Users can update own highlights" ON highlights;
DROP POLICY IF EXISTS "Users can insert own highlights" ON highlights;

-- View public highlights OR own highlights
CREATE POLICY "highlights_select_policy" ON highlights
  FOR SELECT 
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

-- Insert own highlights
CREATE POLICY "highlights_insert_policy" ON highlights
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update own highlights
CREATE POLICY "highlights_update_policy" ON highlights
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 5. COURTS & PACKAGES - PUBLIC READ
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view courts" ON courts;
DROP POLICY IF EXISTS "Anyone can view packages" ON packages;

-- Allow everyone (including unauthenticated) to view courts
CREATE POLICY "courts_select_public" ON courts
  FOR SELECT 
  TO public
  USING (true);

-- Allow everyone to view packages
CREATE POLICY "packages_select_public" ON packages
  FOR SELECT 
  TO public
  USING (true);

-- =====================================================
-- 6. VERIFY POLICIES
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
-- Seed Data for my2light MVP
-- Run this script in Supabase SQL Editor to populate sample data

-- Insert Sample Courts
INSERT INTO courts (id, name, address, thumbnail_url, distance_km, rating, status) VALUES
('court-1', 'CLB Pickleball Cầu Giấy', '123 Đường Cầu Giấy, Hà Nội', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400', 2.5, 4.8, 'available'),
('court-2', 'Sân Pickleball Thủ Đức', '456 Đường Võ Văn Ngân, TP.HCM', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400', 5.2, 4.5, 'live'),
('court-3', 'Arena Pickleball Đống Đa', '789 Láng Hạ, Hà Nội', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400', 1.8, 4.9, 'available')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Packages
INSERT INTO packages (id, name, description, price, duration_minutes, is_best_value) VALUES
('pkg-1', 'Gói Thử Nghiệm', 'Trải nghiệm 30 phút chơi pickleball', 50000, 30, false),
('pkg-2', 'Gói Tiêu Chuẩn', '1 giờ chơi + ghi hình AI', 80000, 60, true),
('pkg-3', 'Gói Premium', '2 giờ chơi + highlight tự động', 150000, 120, false)
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Highlights (for demo)
-- Note: You'll need to replace user_id with actual user IDs after users sign up
-- For now, we'll use a placeholder that you can update later
INSERT INTO highlights (user_id, court_id, thumbnail_url, video_url, duration_sec, likes, views) VALUES
('00000000-0000-0000-0000-000000000000', 'court-1', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=800&fit=crop', 'https://customer-w42898.cloudflarestream.com/sample/manifest/video.m3u8', 25, 12, 150),
('00000000-0000-0000-0000-000000000000', 'court-2', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=800&fit=crop', 'https://customer-w42898.cloudflarestream.com/sample/manifest/video.m3u8', 30, 8, 95),
('00000000-0000-0000-0000-000000000000', 'court-3', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=800&fit=crop', 'https://customer-w42898.cloudflarestream.com/sample/manifest/video.m3u8', 18, 20, 200)
ON CONFLICT DO NOTHING;

-- Verify data
SELECT 'Courts:' as table_name, COUNT(*) as count FROM courts
UNION ALL
SELECT 'Packages:', COUNT(*) FROM packages
UNION ALL
SELECT 'Highlights:', COUNT(*) FROM highlights;
-- Critical Bug Fixes - Database Schema Updates
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. ADD has_onboarded COLUMN TO PROFILES
-- =====================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_onboarded BOOLEAN DEFAULT false;

-- Mark all existing users as already onboarded
UPDATE profiles SET has_onboarded = true WHERE has_onboarded IS NULL OR has_onboarded = false;

-- =====================================================
-- 2. ADD PRIVACY COLUMN TO HIGHLIGHTS
-- =====================================================
ALTER TABLE highlights ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- =====================================================
-- 3. UPDATE HIGHLIGHTS RLS POLICIES
-- =====================================================

-- Drop old policy
DROP POLICY IF EXISTS "Anyone can view highlights" ON highlights;

-- New policy: View public highlights OR own highlights
CREATE POLICY "View public or own highlights" ON highlights
    FOR SELECT USING (
        is_public = true OR auth.uid() = user_id
    );

-- Users can update their own highlights (including privacy setting)
DROP POLICY IF EXISTS "Users can update own highlights" ON highlights;
CREATE POLICY "Users can update own highlights" ON highlights
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 4. CLEAN UP DUPLICATE DATA
-- =====================================================

-- Remove duplicate courts (keep one with lowest id)
WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) as rn
    FROM courts
)
DELETE FROM courts WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Remove duplicate packages
WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) as rn
    FROM packages
)
DELETE FROM packages WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- =====================================================
-- 5. VERIFY CHANGES
-- =====================================================
SELECT 
    'profiles' as table_name, 
    COUNT(*) as total,
    COUNT(CASE WHEN has_onboarded THEN 1 END) as onboarded_users
FROM profiles
UNION ALL
SELECT 
    'highlights',
    COUNT(*),
    COUNT(CASE WHEN is_public THEN 1 END)
FROM highlights
UNION ALL
SELECT 'courts', COUNT(*), NULL FROM courts
UNION ALL
SELECT 'packages', COUNT(*), NULL FROM packages;
-- Check existing courts
SELECT id, name FROM courts;
-- BƯỚC 1: Kiểm tra kiểu dữ liệu của courts.id
-- Chạy lệnh này TRƯỚC để biết id là TEXT hay UUID
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'courts' 
ORDER BY ordinal_position;

-- Sau khi chạy, bạn sẽ thấy:
-- Nếu id là "text" → Chạy file fix_schema_v2.sql
-- Nếu id là "uuid" → Chạy file fix_schema_uuid.sql (tôi sẽ tạo ngay)
-- Create sample highlights for your user
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users table
-- To get your user ID: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Step 1: Find your user ID (run this first)
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Step 2: Copy your user ID and replace below, then run
INSERT INTO highlights (user_id, court_id, thumbnail_url, video_url, duration_sec, likes, views) VALUES
('YOUR_USER_ID_HERE', 'court-1', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=800&fit=crop', 'https://customer-w42898.cloudflarestream.com/sample/manifest/video.m3u8', 25, 12, 150),
('YOUR_USER_ID_HERE', 'court-2', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=800&fit=crop', 'https://customer-w42898.cloudflarestream.com/sample/manifest/video.m3u8', 30, 8, 95),
('YOUR_USER_ID_HERE', 'court-3', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=800&fit=crop', 'https://customer-w42898.cloudflarestream.com/sample/manifest/video.m3u8', 18, 20, 200)
ON CONFLICT DO NOTHING;
-- DEBUG: Check if profile was created after signup
-- Run this after you sign up with a new account

-- 1. Get the user ID from auth.users
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check if profile exists for that user
-- Replace 'USER_ID_HERE' with the actual user ID from step 1
SELECT * 
FROM profiles 
WHERE id = 'USER_ID_HERE';

-- 3. If no profile, manually create one for testing
-- Replace 'USER_ID_HERE' with actual user ID
INSERT INTO profiles (id, name, phone, credits, membership_tier, has_onboarded)
VALUES (
  'USER_ID_HERE',
  'Test User',
  '0912345678',
  200000,
  'free',
  true
)
ON CONFLICT (id) DO UPDATE
SET name = 'Test User',
    phone = '0912345678',
    has_onboarded = true;

-- 4. Verify
SELECT * FROM profiles WHERE id = 'USER_ID_HERE';
-- FINAL FIX - All tables use UUID
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. ADD MISSING COLUMNS
-- =====================================================
ALTER TABLE courts ADD COLUMN IF NOT EXISTS distance_km DECIMAL(5,2) DEFAULT 0;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1) DEFAULT 4.5;

-- =====================================================
-- 2. INSERT COURTS (with UUID)
-- =====================================================
INSERT INTO courts (id, name, address, status, thumbnail_url, price_per_hour, distance_km, rating) VALUES
(gen_random_uuid(), 'CLB Pickleball Cầu Giấy', '123 Đường Cầu Giấy, Hà Nội', 'available', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400', 150000, 2.5, 4.8),
(gen_random_uuid(), 'Sân Pickleball Thủ Đức', '456 Đường Võ Văn Ngân, TP.HCM', 'live', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400', 200000, 5.2, 4.5),
(gen_random_uuid(), 'Arena Pickleball Đống Đa', '789 Láng Hạ, Hà Nội', 'available', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400', 100000, 1.8, 4.9)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. INSERT PACKAGES (with UUID)
-- =====================================================
INSERT INTO packages (id, name, description, price, duration_minutes, is_best_value) VALUES
(gen_random_uuid(), 'Gói Thử Nghiệm', 'Trải nghiệm 30 phút chơi pickleball', 50000, 30, false),
(gen_random_uuid(), 'Gói Tiêu Chuẩn', '1 giờ chơi + ghi hình AI', 80000, 60, true),
(gen_random_uuid(), 'Gói Premium', '2 giờ chơi + highlight tự động', 150000, 120, false)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. VERIFY DATA
-- =====================================================
SELECT 'Courts' as table_name, COUNT(*) as count FROM courts
UNION ALL
SELECT 'Packages', COUNT(*) FROM packages;

-- =====================================================
-- 5. VIEW SAMPLE DATA
-- =====================================================
SELECT id, name, distance_km, rating FROM courts LIMIT 5;
SELECT id, name, price, duration_minutes FROM packages LIMIT 5;
-- Fix missing columns in courts table and update seed data
-- Run this in Supabase SQL Editor

-- Add missing columns to courts table
ALTER TABLE courts ADD COLUMN IF NOT EXISTS distance_km DECIMAL(5,2) DEFAULT 0;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1) DEFAULT 4.5;

-- Update existing courts with distance and rating
UPDATE courts SET distance_km = 2.5, rating = 4.8 WHERE id = 'c1';
UPDATE courts SET distance_km = 5.2, rating = 4.5 WHERE id = 'c2';
UPDATE courts SET distance_km = 1.8, rating = 4.9 WHERE id = 'c3';

-- Insert additional sample courts if needed
INSERT INTO courts (id, name, address, status, thumbnail_url, price_per_hour, distance_km, rating) VALUES
('court-1', 'CLB Pickleball Cầu Giấy', '123 Đường Cầu Giấy, Hà Nội', 'available', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400', 150000, 2.5, 4.8),
('court-2', 'Sân Pickleball Thủ Đức', '456 Đường Võ Văn Ngân, TP.HCM', 'live', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400', 200000, 5.2, 4.5),
('court-3', 'Arena Pickleball Đống Đa', '789 Láng Hạ, Hà Nội', 'available', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400', 100000, 1.8, 4.9)
ON CONFLICT (id) DO UPDATE SET
    distance_km = EXCLUDED.distance_km,
    rating = EXCLUDED.rating;

-- Insert sample packages
INSERT INTO packages (id, name, description, price, duration_minutes, is_best_value) VALUES
('pkg-1', 'Gói Thử Nghiệm', 'Trải nghiệm 30 phút chơi pickleball', 50000, 30, false),
('pkg-2', 'Gói Tiêu Chuẩn', '1 giờ chơi + ghi hình AI', 80000, 60, true),
('pkg-3', 'Gói Premium', '2 giờ chơi + highlight tự động', 150000, 120, false)
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT 'Courts' as table_name, COUNT(*) as count FROM courts
UNION ALL
SELECT 'Packages', COUNT(*) FROM packages;
-- Fix Schema for UUID-based courts table
-- CHẠY FILE NÀY nếu courts.id là UUID

-- Add missing columns
ALTER TABLE courts ADD COLUMN IF NOT EXISTS distance_km DECIMAL(5,2) DEFAULT 0;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1) DEFAULT 4.5;

-- Update existing courts by name (since we can't predict UUID)
UPDATE courts SET distance_km = 2.5, rating = 4.8 WHERE name LIKE '%Cầu Giấy%';
UPDATE courts SET distance_km = 5.2, rating = 4.5 WHERE name LIKE '%Tennis%' OR name LIKE '%Thành Phố%';
UPDATE courts SET distance_km = 1.8, rating = 4.9 WHERE name LIKE '%Ciputra%' OR name LIKE '%Cầu Lông%';

-- Delete old courts if needed and insert new ones with proper UUIDs
-- OPTION 1: Keep existing courts, just update them
-- (Already done above)

-- OPTION 2: Delete and recreate (CAREFUL!)
-- DELETE FROM courts; -- Uncomment if you want fresh start
-- Then insert with gen_random_uuid():

INSERT INTO courts (id, name, address, status, thumbnail_url, price_per_hour, distance_km, rating) VALUES
(gen_random_uuid(), 'CLB Pickleball Cầu Giấy', '123 Đường Cầu Giấy, Hà Nội', 'available', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400', 150000, 2.5, 4.8),
(gen_random_uuid(), 'Sân Pickleball Thủ Đức', '456 Đường Võ Văn Ngân, TP.HCM', 'live', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400', 200000, 5.2, 4.5),
(gen_random_uuid(), 'Arena Pickleball Đống Đa', '789 Láng Hạ, Hà Nội', 'available', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400', 100000, 1.8, 4.9)
ON CONFLICT DO NOTHING;

-- Insert packages (TEXT id, should work fine)
INSERT INTO packages (id, name, description, price, duration_minutes, is_best_value) VALUES
('pkg-1', 'Gói Thử Nghiệm', 'Trải nghiệm 30 phút chơi pickleball', 50000, 30, false),
('pkg-2', 'Gói Tiêu Chuẩn', '1 giờ chơi + ghi hình AI', 80000, 60, true),
('pkg-3', 'Gói Premium', '2 giờ chọi + highlight tự động', 150000, 120, false)
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT 'Courts' as table_name, COUNT(*) as count FROM courts
UNION ALL
SELECT 'Packages', COUNT(*) FROM packages;
-- Fix Schema v2 - Compatible with UUID court IDs
-- Run this in Supabase SQL Editor

-- First, check current court table structure
-- If courts.id is UUID, we need to use gen_random_uuid() or cast properly

-- Add missing columns to courts table (if not exists)
ALTER TABLE courts ADD COLUMN IF NOT EXISTS distance_km DECIMAL(5,2) DEFAULT 0;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1) DEFAULT 4.5;

-- Update existing courts (using their current IDs)
-- First, let's see what courts exist
-- SELECT id, name FROM courts;

-- If you have existing courts with UUID ids (c1, c2, c3), update them:
UPDATE courts SET distance_km = 2.5, rating = 4.8 WHERE name LIKE '%Cầu Giấy%';
UPDATE courts SET distance_km = 5.2, rating = 4.5 WHERE name LIKE '%Tennis%';
UPDATE courts SET distance_km = 1.8, rating = 4.9 WHERE name LIKE '%Ciputra%';

-- If no courts exist, we need to check the id column type first
-- Run this to check:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'courts' AND column_name = 'id';

-- If id is TEXT (not UUID), use this INSERT:
INSERT INTO courts (id, name, address, status, thumbnail_url, price_per_hour, distance_km, rating) VALUES
('court-1', 'CLB Pickleball Cầu Giấy', '123 Đường Cầu Giấy, Hà Nội', 'available', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400', 150000, 2.5, 4.8),
('court-2', 'Sân Pickleball Thủ Đức', '456 Đường Võ Văn Ngân, TP.HCM', 'live', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400', 200000, 5.2, 4.5),
('court-3', 'Arena Pickleball Đống Đa', '789 Láng Hạ, Hà Nội', 'available', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400', 100000, 1.8, 4.9)
ON CONFLICT (id) DO UPDATE SET
    distance_km = EXCLUDED.distance_km,
    rating = EXCLUDED.rating,
    thumbnail_url = EXCLUDED.thumbnail_url;

-- Insert sample packages (these should work fine)
INSERT INTO packages (id, name, description, price, duration_minutes, is_best_value) VALUES
('pkg-1', 'Gói Thử Nghiệm', 'Trải nghiệm 30 phút chơi pickleball', 50000, 30, false),
('pkg-2', 'Gói Tiêu Chuẩn', '1 giờ chơi + ghi hình AI', 80000, 60, true),
('pkg-3', 'Gói Premium', '2 giờ chơi + highlight tự động', 150000, 120, false)
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT 'Courts' as table_name, COUNT(*) as count FROM courts
UNION ALL
SELECT 'Packages', COUNT(*) FROM packages;
-- Get a valid court ID for testing QR Scan
SELECT id, name FROM courts LIMIT 1;
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
