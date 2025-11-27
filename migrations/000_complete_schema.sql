-- ============================================
-- COMPLETE DATABASE SCHEMA MIGRATION
-- My2Light - Court Management System
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. PROFILES TABLE (extends Supabase Auth)
-- ============================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS avatar TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 200000,
ADD COLUMN IF NOT EXISTS membership_tier TEXT DEFAULT 'free' CHECK (membership_tier IN ('free', 'pro', 'elite')),
ADD COLUMN IF NOT EXISTS total_highlights INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_onboarded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'player' CHECK (role IN ('player', 'court_owner', 'both'));

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================
-- 2. COURT_OWNERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS court_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  tax_id TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  bank_account TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_court_owners_profile_id ON court_owners(profile_id);

-- Enable RLS
ALTER TABLE court_owners ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Court owners can view own data" ON court_owners;
CREATE POLICY "Court owners can view own data"
  ON court_owners FOR SELECT
  USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Court owners can update own data" ON court_owners;
CREATE POLICY "Court owners can update own data"
  ON court_owners FOR UPDATE
  USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can insert court owner profile" ON court_owners;
CREATE POLICY "Users can insert court owner profile"
  ON court_owners FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- ============================================
-- 3. COURTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES court_owners(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  price_per_hour INTEGER NOT NULL DEFAULT 0,
  open_time TEXT DEFAULT '06:00',
  close_time TEXT DEFAULT '22:00',
  facilities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('live', 'busy', 'available', 'maintenance')),
  rating DECIMAL DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  distance_km DECIMAL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  auto_approve_bookings BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courts_owner_id ON courts(owner_id);
CREATE INDEX IF NOT EXISTS idx_courts_is_active ON courts(is_active);
CREATE INDEX IF NOT EXISTS idx_courts_created_at ON courts(created_at DESC);

-- Enable RLS
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view active courts" ON courts;
CREATE POLICY "Anyone can view active courts"
  ON courts FOR SELECT
  USING (is_active = true OR auth.uid() IN (
    SELECT profile_id FROM court_owners WHERE id = courts.owner_id
  ));

DROP POLICY IF EXISTS "Court owners can insert courts" ON courts;
CREATE POLICY "Court owners can insert courts"
  ON courts FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT profile_id FROM court_owners WHERE id = courts.owner_id
  ));

DROP POLICY IF EXISTS "Court owners can update own courts" ON courts;
CREATE POLICY "Court owners can update own courts"
  ON courts FOR UPDATE
  USING (auth.uid() IN (
    SELECT profile_id FROM court_owners WHERE id = courts.owner_id
  ));

DROP POLICY IF EXISTS "Court owners can delete own courts" ON courts;
CREATE POLICY "Court owners can delete own courts"
  ON courts FOR DELETE
  USING (auth.uid() IN (
    SELECT profile_id FROM court_owners WHERE id = courts.owner_id
  ));

-- ============================================
-- 4. PACKAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'standard' CHECK (type IN ('standard', 'full_match')),
ADD COLUMN IF NOT EXISTS is_best_value BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read packages
DROP POLICY IF EXISTS "Anyone can view packages" ON packages;
CREATE POLICY "Anyone can view packages"
  ON packages FOR SELECT
  TO authenticated
  USING (true);

-- Insert default packages if not exists
INSERT INTO packages (id, name, description, duration_minutes, price, type, is_best_value)
VALUES 
  ('pkg_basic', 'Rally Mode', 'Tự động lưu highlight, 30 giây/clip', 60, 150000, 'standard', false),
  ('pkg_premium', 'Full Match', 'Quay toàn bộ trận, AI tạo highlight, Tải về full HD', 120, 300000, 'full_match', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. BOOKINGS TABLE
-- ============================================

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

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_court_id ON bookings(court_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Court owners can view court bookings" ON bookings;
CREATE POLICY "Court owners can view court bookings"
  ON bookings FOR SELECT
  USING (court_id IN (
    SELECT c.id FROM courts c
    INNER JOIN court_owners co ON c.owner_id = co.id
    WHERE co.profile_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Court owners can update court bookings" ON bookings;
CREATE POLICY "Court owners can update court bookings"
  ON bookings FOR UPDATE
  USING (court_id IN (
    SELECT c.id FROM courts c
    INNER JOIN court_owners co ON c.owner_id = co.id
    WHERE co.profile_id = auth.uid()
  ));

-- ============================================
-- 6. HIGHLIGHTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT NOT NULL,
  video_url TEXT NOT NULL,
  duration_sec INTEGER NOT NULL,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_court_id ON highlights(court_id);
CREATE INDEX IF NOT EXISTS idx_highlights_created_at ON highlights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_highlights_is_public ON highlights(is_public);

-- Enable RLS
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view public highlights" ON highlights;
CREATE POLICY "Anyone can view public highlights"
  ON highlights FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create highlights" ON highlights;
CREATE POLICY "Users can create highlights"
  ON highlights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own highlights" ON highlights;
CREATE POLICY "Users can update own highlights"
  ON highlights FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own highlights" ON highlights;
CREATE POLICY "Users can delete own highlights"
  ON highlights FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 7. TRIGGERS & FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_court_owners_updated_at ON court_owners;
CREATE TRIGGER update_court_owners_updated_at
  BEFORE UPDATE ON court_owners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courts_updated_at ON courts;
CREATE TRIGGER update_courts_updated_at
  BEFORE UPDATE ON courts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. VERIFICATION QUERIES
-- ============================================

-- Check profiles columns
SELECT 'profiles' as table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('role', 'credits', 'membership_tier', 'has_onboarded')
ORDER BY column_name;

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('court_owners', 'courts', 'packages', 'bookings', 'highlights')
ORDER BY table_name;

-- Check courts columns
SELECT 'courts' as table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'courts'
ORDER BY column_name;

-- Check bookings columns
SELECT 'bookings' as table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'bookings'
ORDER BY column_name;

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
