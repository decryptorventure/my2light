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
