-- =====================================================
-- Migration 005: Production Hotfix - RLS Policy Adjustments
-- Version: 3.5.0
-- Date: 2025-11-28
-- Description: Fix RLS policies causing 400/404 errors in production
-- =====================================================

-- =====================================================
-- PROBLEM ANALYSIS:
-- 1. player_activities policy requires connections - fails for new users
-- 2. Need to allow anon/public read for unauthenticated browsing
-- 3. profiles table needs SELECT policy for authenticated users
-- =====================================================

-- =====================================================
-- 1. Fix profiles table - allow authenticated users to read profiles
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

-- Allow authenticated users to read all profiles
CREATE POLICY "Authenticated users can view profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Users can insert their own profile (for profile creation)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. Fix player_activities - allow users to see all activities
-- =====================================================

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view relevant activities" ON player_activities;

-- New policy: Authenticated users can see all public activities
CREATE POLICY "Authenticated users can view activities"
    ON player_activities FOR SELECT
    TO authenticated
    USING (true);

-- System/service can insert activities
DROP POLICY IF EXISTS "Service can insert activities" ON player_activities;
CREATE POLICY "Service can insert activities"
    ON player_activities FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. Fix player_connections for better UX
-- =====================================================

-- The existing policies are fine, but let's ensure they're explicit
DROP POLICY IF EXISTS "Users can view their connections" ON player_connections;
CREATE POLICY "Users can view their connections"
    ON player_connections FOR SELECT
    TO authenticated
    USING (
        auth.uid() = requester_id OR 
        auth.uid() = receiver_id
    );

DROP POLICY IF EXISTS "Users can create connection requests" ON player_connections;
CREATE POLICY "Users can create connection requests"
    ON player_connections FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Receivers can update connection status" ON player_connections;
CREATE POLICY "Receivers can update connection status"
    ON player_connections FOR UPDATE
    TO authenticated
    USING (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can delete their connections" ON player_connections;
CREATE POLICY "Users can delete their connections"
    ON player_connections FOR DELETE
    TO authenticated
    USING (
        auth.uid() = requester_id OR 
        auth.uid() = receiver_id
    );

-- =====================================================
-- 4. Ensure packages table is readable
-- =====================================================

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view packages" ON packages;
CREATE POLICY "Anyone can view packages"
    ON packages FOR SELECT
    TO authenticated
    USING (true);

-- Allow anon users to view packages (for browse before login)
DROP POLICY IF EXISTS "Anon can view packages" ON packages;
CREATE POLICY "Anon can view packages"
    ON packages FOR SELECT
    TO anon
    USING (true);

-- =====================================================
-- 5. Ensure courts table is browseable
-- =====================================================

-- Already has good policies, but let's add anon access
DROP POLICY IF EXISTS "Anon can view active courts" ON courts;
CREATE POLICY "Anon can view active courts"
    ON courts FOR SELECT
    TO anon
    USING (is_active = true);

-- =====================================================
-- 6. Ensure highlights can be browsed by anon
-- =====================================================

DROP POLICY IF EXISTS "Anon can view public highlights" ON highlights;
CREATE POLICY "Anon can view public highlights"
    ON highlights FOR SELECT
    TO anon
    USING (is_public = true);

-- =====================================================
-- 7. Fix highlight_interactions for better UX
-- =====================================================

-- Simplify the SELECT policy
DROP POLICY IF EXISTS "Anyone can view interactions on public highlights" ON highlight_interactions;
DROP POLICY IF EXISTS "Owners can view all interactions on their highlights" ON highlight_interactions;

-- Single unified policy
CREATE POLICY "Authenticated users can view interactions"
    ON highlight_interactions FOR SELECT
    TO authenticated
    USING (
        -- Can see interactions on public highlights
        EXISTS (
            SELECT 1 FROM highlights 
            WHERE id = highlight_id AND is_public = true
        ) OR
        -- Or on own highlights
        EXISTS (
            SELECT 1 FROM highlights 
            WHERE id = highlight_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Authenticated users can create interactions" ON highlight_interactions;
CREATE POLICY "Authenticated users can create interactions"
    ON highlight_interactions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own interactions" ON highlight_interactions;
CREATE POLICY "Users can delete their own interactions"
    ON highlight_interactions FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- =====================================================
-- 8. Fix highlight_comments for better UX
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view comments on public highlights" ON highlight_comments;

CREATE POLICY "Authenticated users can view comments"
    ON highlight_comments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM highlights 
            WHERE id = highlight_id AND (is_public = true OR user_id = auth.uid())
        )
    );

-- Anon can view comments on public highlights
DROP POLICY IF EXISTS "Anon can view comments on public highlights" ON highlight_comments;
CREATE POLICY "Anon can view comments on public highlights"
    ON highlight_comments FOR SELECT
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM highlights 
            WHERE id = highlight_id AND is_public = true
        )
    );

DROP POLICY IF EXISTS "Authenticated users can create comments" ON highlight_comments;
CREATE POLICY "Authenticated users can create comments"
    ON highlight_comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON highlight_comments;
CREATE POLICY "Users can update their own comments"
    ON highlight_comments FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON highlight_comments;
CREATE POLICY "Users can delete their own comments"
    ON highlight_comments FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- =====================================================
-- 9. Verify and Grant Permissions
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant SELECT on key tables to authenticated
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON courts TO authenticated, anon;
GRANT SELECT ON packages TO authenticated, anon;
GRANT SELECT ON highlights TO authenticated, anon;
GRANT SELECT ON player_connections TO authenticated;
GRANT SELECT ON player_activities TO authenticated;
GRANT SELECT ON highlight_interactions TO authenticated;
GRANT SELECT ON highlight_comments TO authenticated, anon;

-- Grant CRUD on own data
GRANT INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON highlights TO authenticated;
GRANT INSERT, UPDATE, DELETE ON player_connections TO authenticated;
GRANT INSERT, DELETE ON highlight_interactions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON highlight_comments TO authenticated;

-- =====================================================
-- 10. VERIFICATION
-- =====================================================

DO $$
BEGIN
    -- Check that all tables have RLS enabled
    ASSERT (SELECT COUNT(*) FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename IN ('profiles', 'courts', 'packages', 'highlights', 
                             'player_connections', 'player_activities', 
                             'highlight_interactions', 'highlight_comments')
            AND rowsecurity = true) = 8,
           'Not all tables have RLS enabled';
    
    RAISE NOTICE 'Migration 005 completed successfully!';
    RAISE NOTICE 'RLS policies have been updated for better UX';
    RAISE NOTICE 'Anonymous users can now browse courts, packages, and public highlights';
    RAISE NOTICE 'Authenticated users can see all profiles and activities';
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
