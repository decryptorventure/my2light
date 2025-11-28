-- =====================================================
-- EMERGENCY: Create Missing Bookings Table
-- Run this NOW in Supabase SQL Editor
-- =====================================================

-- Create bookings table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_court_id ON bookings(court_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Court owners can view court bookings" ON bookings;
DROP POLICY IF EXISTS "Court owners can update court bookings" ON bookings;

-- Create RLS Policies
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

CREATE POLICY "Court owners can view court bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (court_id IN (
    SELECT c.id FROM courts c
    INNER JOIN court_owners co ON c.owner_id = co.id
    WHERE co.profile_id = auth.uid()
  ));

CREATE POLICY "Court owners can update court bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (court_id IN (
    SELECT c.id FROM courts c
    INNER JOIN court_owners co ON c.owner_id = co.id
    WHERE co.profile_id = auth.uid()
  ));

-- Create or replace update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update trigger
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON bookings TO authenticated;

-- Force schema reload
NOTIFY pgrst, 'reload schema';

-- Verify table was created
SELECT 
    'SUCCESS!' as status,
    COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND table_name = 'bookings';

-- Verify policies
SELECT 
    'Policies Created:' as status,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'bookings';

-- Show final structure
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'bookings'
ORDER BY ordinal_position;

-- =====================================================
-- EXPECTED RESULTS:
-- - SUCCESS! table_count = 1
-- - Policies Created: policy_count = 5
-- - Column list showing all bookings fields
-- =====================================================
