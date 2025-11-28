-- =====================================================
-- Diagnostic Queries for v3.5 Production Issues
-- Run these in Supabase SQL Editor to diagnose problems
-- =====================================================

-- 1. Verify all tables exist
SELECT 
    table_name, 
    table_type
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public'
    AND table_name IN (
        'profiles',
        'bookings',
        'highlights',
        'courts',
        'packages',
        'player_connections',
        'highlight_interactions',
        'highlight_comments',
        'player_activities',
        'analytics_cache'
    )
ORDER BY table_name;

-- Expected: Should see 10 tables

-- =====================================================
-- 2. Check RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM 
    pg_tables
WHERE 
    schemaname = 'public'
    AND tablename IN (
        'player_connections',
        'highlight_interactions',
        'highlight_comments',
        'player_activities',
        'analytics_cache'
    );

-- Expected: rowsecurity should be 't' (true) for all

-- =====================================================
-- 3. List all RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM 
    pg_policies
WHERE 
    schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected: Should see policies from migration 004

-- =====================================================
-- 4. Check if bookings table exists (404 error)
SELECT 
    COUNT(*) as table_exists,
    (SELECT COUNT(*) FROM bookings) as record_count
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public'
    AND table_name = 'bookings';

-- If table_exists = 0, table is missing!

-- =====================================================
-- 5. Test player_connections query (400 error)
-- Try a simple select to see what error we get
SELECT 
    id, 
    requester_id, 
    receiver_id, 
    status,
    created_at
FROM 
    player_connections
LIMIT 5;

-- If this fails, check the specific error message

-- =====================================================
-- 6. Test player_activities query (400 error)
SELECT 
    id,
    user_id,
    activity_type,
    metadata,
    created_at
FROM 
    player_activities
LIMIT 5;

-- =====================================================
-- 7. Check for any data in new tables
SELECT 'player_connections' as table_name, COUNT(*) as count FROM player_connections
UNION ALL
SELECT 'highlight_interactions', COUNT(*) FROM highlight_interactions
UNION ALL
SELECT 'highlight_comments', COUNT(*) FROM highlight_comments
UNION ALL
SELECT 'player_activities', COUNT(*) FROM player_activities
UNION ALL
SELECT 'analytics_cache', COUNT(*) FROM analytics_cache;

-- =====================================================
-- 8. Verify column additions to existing tables
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name = 'highlights'
    AND column_name IN (
        'likes_count',
        'views_count',
        'shares_count',
        'comments_count',
        'is_public'
    )
ORDER BY column_name;

-- Expected: Should see 5 new columns

SELECT 
    column_name, 
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name IN (
        'skill_level',
        'profile_visibility',
        'show_stats',
        'bio',
        'followers_count',
        'following_count',
        'last_active_at'
    )
ORDER BY column_name;

-- Expected: Should see 7 new columns

-- =====================================================
-- 9. Check if functions/triggers were created
SELECT 
    routine_name,
    routine_type
FROM 
    information_schema.routines
WHERE 
    routine_schema = 'public'
    AND routine_name IN (
        'update_updated_at_column',
        'update_follower_counts',
        'update_highlight_interaction_counts',
        'update_highlight_comment_counts',
        'create_highlight_activity',
        'create_connection_activity'
    );

-- Expected: Should see 6 functions

-- =====================================================
-- 10. Test authentication context
-- Run this while logged in as a user
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role,
    (auth.uid() IS NOT NULL) as is_authenticated;

-- Expected: Should see a UUID and role = 'authenticated'

-- =====================================================
-- COMMON FIXES
-- =====================================================

-- If RLS is blocking queries, temporarily check what's happening:
-- (Run each query separately as the authenticated user)

-- Test 1: Can I read my own connections?
SELECT * FROM player_connections 
WHERE requester_id = auth.uid() OR receiver_id = auth.uid();

-- Test 2: Can I read activities?
SELECT * FROM player_activities 
WHERE user_id = auth.uid();

-- Test 3: Check if auth.uid() is working
SELECT auth.uid(), auth.role();

-- =====================================================
-- If still having issues, you might need to grant permissions:
-- (Only run if necessary - this bypasses RLS temporarily for testing)

-- GRANT SELECT ON player_connections TO authenticated;
-- GRANT SELECT ON player_activities TO authenticated;
-- GRANT SELECT ON highlight_interactions TO authenticated;
-- GRANT SELECT ON highlight_comments TO authenticated;

-- =====================================================
-- END OF DIAGNOSTIC QUERIES
-- =====================================================
