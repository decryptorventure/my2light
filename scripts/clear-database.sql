-- =====================================================
-- CLEAR ALL DATA (KEEP SCHEMA)
-- WARNING: This will delete ALL data but keep tables/structure
-- =====================================================

-- Disable triggers temporarily to avoid cascade issues
SET session_replication_role = 'replica';

-- Clear all data from tables (in correct order to avoid FK violations)
TRUNCATE TABLE highlight_comments CASCADE;
TRUNCATE TABLE highlight_interactions CASCADE;
TRUNCATE TABLE player_activities CASCADE;
TRUNCATE TABLE player_connections CASCADE;
TRUNCATE TABLE analytics_cache CASCADE;
TRUNCATE TABLE video_segments CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE highlights CASCADE;
TRUNCATE TABLE bookings CASCADE;
TRUNCATE TABLE courts CASCADE;
TRUNCATE TABLE court_owners CASCADE;
TRUNCATE TABLE match_requests CASCADE;
TRUNCATE TABLE user_memberships CASCADE;
TRUNCATE TABLE transactions CASCADE;

-- Clear profiles (but keep auth.users)
-- Only delete profile data, not auth records
DELETE FROM profiles WHERE id NOT IN (SELECT id FROM auth.users);

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Reset sequences if needed
-- ALTER SEQUENCE IF EXISTS some_sequence RESTART WITH 1;

SELECT 'Database cleared successfully' as status;
