-- Phase 1: Court Management - Database Schema
-- Run this in Supabase SQL Editor

-- 1. Add role column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'player' CHECK (role IN ('player', 'court_owner', 'both'));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 2. Create court_owners table
CREATE TABLE IF NOT EXISTS court_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT,
  tax_id TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  bank_account TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Enable RLS
ALTER TABLE court_owners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for court_owners
CREATE POLICY "Court owners can view their own data"
  ON court_owners FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Court owners can update their own data"
  ON court_owners FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their court owner profile"
  ON court_owners FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- 3. Update courts table
ALTER TABLE courts
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES court_owners(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_approve_bookings BOOLEAN DEFAULT true;

-- Add index
CREATE INDEX IF NOT EXISTS idx_courts_owner_id ON courts(owner_id);

-- 4. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Create trigger for court_owners
DROP TRIGGER IF EXISTS update_court_owners_updated_at ON court_owners;
CREATE TRIGGER update_court_owners_updated_at
    BEFORE UPDATE ON court_owners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verification queries
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'court_owners';
