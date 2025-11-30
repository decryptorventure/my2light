-- =====================================================
-- PERFORMANCE ANALYSIS SCRIPT
-- Run this in Supabase SQL Editor to diagnose issues
-- =====================================================

-- 1. Check table sizes and row counts
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = tablename) AS column_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 2. Check row counts for main tables
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'courts', COUNT(*) FROM courts
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'highlights', COUNT(*) FROM highlights
UNION ALL
SELECT 'player_activities', COUNT(*) FROM player_activities
UNION ALL
SELECT 'player_connections', COUNT(*) FROM player_connections
UNION ALL
SELECT 'highlight_interactions', COUNT(*) FROM highlight_interactions
UNION ALL
SELECT 'highlight_comments', COUNT(*) FROM highlight_comments
ORDER BY row_count DESC;

-- 3. Check for missing indexes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.1
ORDER BY n_distinct DESC;

-- 4. Check for slow queries (if pg_stat_statements is enabled)
-- SELECT 
--     query,
--     calls,
--     total_time,
--     mean_time,
--     max_time
-- FROM pg_stat_statements
-- WHERE query NOT LIKE '%pg_stat_statements%'
-- ORDER BY mean_time DESC
-- LIMIT 20;

-- 5. Check storage bucket sizes
SELECT 
    name,
    created_at,
    updated_at,
    public
FROM storage.buckets;

-- 6. Analyze table statistics
ANALYZE profiles;
ANALYZE courts;
ANALYZE bookings;
ANALYZE highlights;
ANALYZE player_activities;
ANALYZE player_connections;

SELECT 'Analysis complete' as status;
