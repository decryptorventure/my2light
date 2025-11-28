-- =====================================================
-- COMPREHENSIVE BOOKINGS TABLE DIAGNOSTIC
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- Step 1: Check if bookings table exists
SELECT 
    'STEP 1: Table Existence Check' as step,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'bookings'
        ) THEN '✅ Table EXISTS'
        ELSE '❌ Table MISSING - CRITICAL ERROR'
    END as result;

-- Step 2: If table exists, show its structure
SELECT 
    'STEP 2: Table Columns' as step,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'bookings'
ORDER BY ordinal_position;

-- Step 3: Check RLS status
SELECT 
    'STEP 3: RLS Status' as step,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
    AND tablename = 'bookings';

-- Step 4: Check RLS policies
SELECT 
    'STEP 4: RLS Policies' as step,
    policyname,
    permissive,
    roles,
    cmd,
    SUBSTRING(qual::text, 1, 100) as qual_preview
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'bookings'
ORDER BY policyname;

-- Step 5: Check table ownership and permissions
SELECT 
    'STEP 5: Table Ownership' as step,
    t.tablename,
    t.tableowner,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename))) as size
FROM pg_tables t
WHERE t.schemaname = 'public' 
    AND t.tablename = 'bookings';

-- Step 6: Check grants
SELECT 
    'STEP 6: Table Grants' as step,
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
    AND table_name = 'bookings'
ORDER BY grantee, privilege_type;

-- Step 7: Try to count records (will fail if table doesn't exist)
SELECT 
    'STEP 7: Data Check' as step,
    COUNT(*) as total_bookings
FROM bookings;

-- Step 8: Force schema reload (CRITICAL)
NOTIFY pgrst, 'reload schema';
SELECT 'STEP 8: Schema Reloaded' as step, 'Schema cache has been refreshed' as result;

-- =====================================================
-- INTERPRETATION GUIDE
-- =====================================================

-- If STEP 1 shows "Table MISSING":
--    → You need to run migration 000_complete_schema.sql
--    
-- If STEP 1 shows "Table EXISTS" but you still get errors:
--    → Check STEP 3: RLS must be enabled
--    → Check STEP 4: Must have policies for authenticated users
--    → Check STEP 6: Must have SELECT grant for authenticated
--    → Run STEP 8 again and wait 30 seconds
--
-- If STEP 7 fails:
--    → RLS policies are blocking access
--    → Check if you're running this as authenticated user
--
-- =====================================================
-- EMERGENCY FIX (if bookings table is missing)
-- =====================================================

-- Uncomment and run this ONLY if STEP 1 shows table is missing:

/*
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  package_id TEXT REFERENCES packages(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  total_amount INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  rescheduled_from TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_court_id ON bookings(court_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Force reload
NOTIFY pgrst, 'reload schema';
*/

-- =====================================================
-- SAVE RESULTS AND SEND TO DEVELOPER
-- =====================================================
