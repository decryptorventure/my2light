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
