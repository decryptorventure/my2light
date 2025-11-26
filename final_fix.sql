-- FINAL FIX - All tables use UUID
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. ADD MISSING COLUMNS
-- =====================================================
ALTER TABLE courts ADD COLUMN IF NOT EXISTS distance_km DECIMAL(5,2) DEFAULT 0;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1) DEFAULT 4.5;

-- =====================================================
-- 2. INSERT COURTS (with UUID)
-- =====================================================
INSERT INTO courts (id, name, address, status, thumbnail_url, price_per_hour, distance_km, rating) VALUES
(gen_random_uuid(), 'CLB Pickleball Cầu Giấy', '123 Đường Cầu Giấy, Hà Nội', 'available', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400', 150000, 2.5, 4.8),
(gen_random_uuid(), 'Sân Pickleball Thủ Đức', '456 Đường Võ Văn Ngân, TP.HCM', 'live', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400', 200000, 5.2, 4.5),
(gen_random_uuid(), 'Arena Pickleball Đống Đa', '789 Láng Hạ, Hà Nội', 'available', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400', 100000, 1.8, 4.9)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. INSERT PACKAGES (with UUID)
-- =====================================================
INSERT INTO packages (id, name, description, price, duration_minutes, is_best_value) VALUES
(gen_random_uuid(), 'Gói Thử Nghiệm', 'Trải nghiệm 30 phút chơi pickleball', 50000, 30, false),
(gen_random_uuid(), 'Gói Tiêu Chuẩn', '1 giờ chơi + ghi hình AI', 80000, 60, true),
(gen_random_uuid(), 'Gói Premium', '2 giờ chơi + highlight tự động', 150000, 120, false)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. VERIFY DATA
-- =====================================================
SELECT 'Courts' as table_name, COUNT(*) as count FROM courts
UNION ALL
SELECT 'Packages', COUNT(*) FROM packages;

-- =====================================================
-- 5. VIEW SAMPLE DATA
-- =====================================================
SELECT id, name, distance_km, rating FROM courts LIMIT 5;
SELECT id, name, price, duration_minutes FROM packages LIMIT 5;
