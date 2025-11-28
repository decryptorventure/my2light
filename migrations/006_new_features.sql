-- =====================================================
-- FEATURE: MATCH FINDING (Cáp kèo)
-- =====================================================

-- Table for match requests
CREATE TABLE IF NOT EXISTS match_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    court_id UUID REFERENCES courts(id), -- Optional, if looking for specific court
    preferred_time TIMESTAMP WITH TIME ZONE,
    skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'pro')),
    match_type TEXT CHECK (match_type IN ('singles', 'doubles', 'any')),
    status TEXT CHECK (status IN ('open', 'matched', 'cancelled', 'expired')) DEFAULT 'open',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for match_requests
ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view open requests" ON match_requests
    FOR SELECT USING (status = 'open');

CREATE POLICY "Users can manage own requests" ON match_requests
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- FEATURE: FLEXIBLE MEMBERSHIPS
-- =====================================================

-- Update packages table to support types
ALTER TABLE packages 
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('per_booking', 'monthly', 'session_pack', 'fixed_slot')) DEFAULT 'per_booking',
ADD COLUMN IF NOT EXISTS session_count INTEGER DEFAULT 0, -- For session_pack
ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 0; -- For monthly/session_pack

-- Table for user memberships/active packages
CREATE TABLE IF NOT EXISTS user_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    package_id TEXT REFERENCES packages(id) NOT NULL,
    remaining_sessions INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('active', 'expired', 'used_up')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for user_memberships
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memberships" ON user_memberships
    FOR SELECT USING (auth.uid() = user_id);

-- Function to check membership validity
CREATE OR REPLACE FUNCTION check_membership_validity() 
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-expire if end_date passed
    IF NEW.end_date < NOW() THEN
        NEW.status := 'expired';
    END IF;
    -- Auto-expire if sessions used up
    IF NEW.remaining_sessions <= 0 AND NEW.remaining_sessions IS NOT NULL THEN
        NEW.status := 'used_up';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_membership_status
    BEFORE UPDATE ON user_memberships
    FOR EACH ROW EXECUTE FUNCTION check_membership_validity();

