-- =====================================================
-- QUICK FIX: Force Supabase Schema Reload
-- Run this in Supabase SQL Editor NOW
-- =====================================================

-- Option 1: Force reload (RECOMMENDED - Run this first)
NOTIFY pgrst, 'reload schema';

-- Option 2: If Option 1 doesn't work, try this
SELECT pg_notify('pgrst', 'reload schema');

-- =====================================================
-- VERIFICATION: Check if bookings table is accessible
-- =====================================================

-- This should return a number without errors
SELECT COUNT(*) as total_bookings FROM bookings;

-- This should show the bookings table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- AFTER RUNNING ABOVE:
-- 1. Wait 10 seconds
-- 2. Reload your app (http://localhost:5173)
-- 3. Try the payment again
-- =====================================================
