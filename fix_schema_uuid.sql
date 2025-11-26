-- Fix Schema for UUID-based courts table
-- CHẠY FILE NÀY nếu courts.id là UUID

-- Add missing columns
ALTER TABLE courts ADD COLUMN IF NOT EXISTS distance_km DECIMAL(5,2) DEFAULT 0;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1) DEFAULT 4.5;

-- Update existing courts by name (since we can't predict UUID)
UPDATE courts SET distance_km = 2.5, rating = 4.8 WHERE name LIKE '%Cầu Giấy%';
UPDATE courts SET distance_km = 5.2, rating = 4.5 WHERE name LIKE '%Tennis%' OR name LIKE '%Thành Phố%';
UPDATE courts SET distance_km = 1.8, rating = 4.9 WHERE name LIKE '%Ciputra%' OR name LIKE '%Cầu Lông%';

-- Delete old courts if needed and insert new ones with proper UUIDs
-- OPTION 1: Keep existing courts, just update them
-- (Already done above)

-- OPTION 2: Delete and recreate (CAREFUL!)
-- DELETE FROM courts; -- Uncomment if you want fresh start
-- Then insert with gen_random_uuid():

INSERT INTO courts (id, name, address, status, thumbnail_url, price_per_hour, distance_km, rating) VALUES
(gen_random_uuid(), 'CLB Pickleball Cầu Giấy', '123 Đường Cầu Giấy, Hà Nội', 'available', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400', 150000, 2.5, 4.8),
(gen_random_uuid(), 'Sân Pickleball Thủ Đức', '456 Đường Võ Văn Ngân, TP.HCM', 'live', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400', 200000, 5.2, 4.5),
(gen_random_uuid(), 'Arena Pickleball Đống Đa', '789 Láng Hạ, Hà Nội', 'available', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400', 100000, 1.8, 4.9)
ON CONFLICT DO NOTHING;

-- Insert packages (TEXT id, should work fine)
INSERT INTO packages (id, name, description, price, duration_minutes, is_best_value) VALUES
('pkg-1', 'Gói Thử Nghiệm', 'Trải nghiệm 30 phút chơi pickleball', 50000, 30, false),
('pkg-2', 'Gói Tiêu Chuẩn', '1 giờ chơi + ghi hình AI', 80000, 60, true),
('pkg-3', 'Gói Premium', '2 giờ chọi + highlight tự động', 150000, 120, false)
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT 'Courts' as table_name, COUNT(*) as count FROM courts
UNION ALL
SELECT 'Packages', COUNT(*) FROM packages;
