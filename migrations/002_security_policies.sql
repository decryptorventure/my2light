-- Phase 7: Database Security (RLS)
-- Run this in Supabase SQL Editor

-- ==========================================
-- 1. PROFILES
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public read access (needed for court owners, leaderboards, etc.)
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- Users can insert their own profile (usually handled by triggers, but good fallback)
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- ==========================================
-- 2. COURTS
-- ==========================================
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

-- Public read access for active courts
CREATE POLICY "Active courts are viewable by everyone"
ON courts FOR SELECT
USING (true);

-- Court Owners can insert courts
CREATE POLICY "Court owners can insert courts"
ON courts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (role = 'court_owner' OR role = 'both')
  )
);

-- Court Owners can update their own courts
CREATE POLICY "Owners can update own courts"
ON courts FOR UPDATE
USING (
  owner_id IN (
    SELECT id FROM court_owners WHERE profile_id = auth.uid()
  )
);

-- Court Owners can delete their own courts
CREATE POLICY "Owners can delete own courts"
ON courts FOR DELETE
USING (
  owner_id IN (
    SELECT id FROM court_owners WHERE profile_id = auth.uid()
  )
);

-- ==========================================
-- 3. BOOKINGS
-- ==========================================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings"
ON bookings FOR SELECT
USING (auth.uid() = user_id);

-- Court Owners can view bookings for their courts
CREATE POLICY "Owners can view bookings for their courts"
ON bookings FOR SELECT
USING (
  court_id IN (
    SELECT c.id FROM courts c
    JOIN court_owners co ON c.owner_id = co.id
    WHERE co.profile_id = auth.uid()
  )
);

-- Users can insert bookings
CREATE POLICY "Authenticated users can create bookings"
ON bookings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings (e.g., cancel)
CREATE POLICY "Users can update own bookings"
ON bookings FOR UPDATE
USING (auth.uid() = user_id);

-- Court Owners can update bookings for their courts (e.g., approve/reject)
CREATE POLICY "Owners can update bookings for their courts"
ON bookings FOR UPDATE
USING (
  court_id IN (
    SELECT c.id FROM courts c
    JOIN court_owners co ON c.owner_id = co.id
    WHERE co.profile_id = auth.uid()
  )
);

-- ==========================================
-- 4. HIGHLIGHTS
-- ==========================================
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

-- Public read access for public highlights
CREATE POLICY "Public highlights are viewable by everyone"
ON highlights FOR SELECT
USING (is_public = true);

-- Users can view their own private highlights
CREATE POLICY "Users can view own highlights"
ON highlights FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own highlights
CREATE POLICY "Users can create highlights"
ON highlights FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own highlights
CREATE POLICY "Users can update own highlights"
ON highlights FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own highlights
CREATE POLICY "Users can delete own highlights"
ON highlights FOR DELETE
USING (auth.uid() = user_id);

-- ==========================================
-- 5. WALLETS / TRANSACTIONS (If applicable)
-- ==========================================
-- Assuming a 'wallets' table exists, otherwise skip or adjust
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wallets') THEN
        ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view own wallet"
        ON wallets FOR SELECT
        USING (auth.uid() = user_id);

        -- Only system/admin should update wallets usually, but for now allow read
    END IF;
END
$$;
