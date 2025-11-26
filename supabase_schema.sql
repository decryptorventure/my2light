-- my2light Supabase Database Schema Setup
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    avatar TEXT,
    phone TEXT,
    total_highlights INTEGER DEFAULT 0,
    credits INTEGER DEFAULT 0,
    membership_tier TEXT DEFAULT 'free' CHECK (membership_tier IN ('free', 'pro', 'elite')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. COURTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS courts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('live', 'busy', 'available', 'maintenance')),
    thumbnail_url TEXT,
    price_per_hour INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read courts
CREATE POLICY "Anyone can view courts" ON courts
    FOR SELECT USING (true);

-- Insert sample courts
INSERT INTO courts (id, name, address, status, thumbnail_url, price_per_hour) VALUES
('c1', 'CLB Pickleball Cầu Giấy', '123 Đường Cầu Giấy, Hà Nội', 'live', 'https://images.unsplash.com/photo-1626248584912-2550cb5a6b0c?q=80&w=800&auto=format&fit=crop', 150000),
('c2', 'Sân Tennis Thành Phố', '45 Đường Tây Hồ, Hà Nội', 'available', 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=800&auto=format&fit=crop', 200000),
('c3', 'Sân Cầu Lông Ciputra', 'Khu Đô Thị Ciputra, Hà Nội', 'busy', 'https://images.unsplash.com/photo-1546519638-68e109498ee3?q=80&w=800&auto=format&fit=crop', 100000)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. PACKAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    is_best_value BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read packages
CREATE POLICY "Anyone can view packages" ON packages
    FOR SELECT USING (true);

-- Insert sample packages
INSERT INTO packages (id, name, duration_minutes, price, description, is_best_value) VALUES
('p1', 'Giao Hữu Nhanh', 60, 30000, 'Phù hợp khởi động hoặc chơi nhanh', false),
('p2', 'Trận Đấu Pro', 120, 50000, 'Gói tiêu chuẩn cho trận đấu đầy đủ', true),
('p3', 'Marathon Thể Lực', 180, 70000, 'Dành cho những chiến binh bền bỉ', false),
('p4', 'Gói Quay Cả Trận', 90, 100000, 'Ghi hình toàn bộ 90 phút Full HD. Tải về qua Wifi tại sân.', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. BOOKINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    court_id TEXT REFERENCES courts(id) NOT NULL,
    package_id TEXT REFERENCES packages(id) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    total_amount INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 5. HIGHLIGHTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS highlights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    court_id TEXT REFERENCES courts(id) NOT NULL,
    thumbnail_url TEXT,
    video_url TEXT,
    duration_sec INTEGER DEFAULT 30,
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for highlights
CREATE POLICY "Anyone can view highlights" ON highlights
    FOR SELECT USING (true);

CREATE POLICY "Users can create own highlights" ON highlights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own highlights" ON highlights
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 6. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. AUTO-CREATE PROFILE ON SIGNUP
-- =====================================================
-- This function automatically creates a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, avatar)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- DONE! Your database is ready.
-- =====================================================
