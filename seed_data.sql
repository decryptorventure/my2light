-- Seed Data for my2light MVP
-- Run this script in Supabase SQL Editor to populate sample data

-- Insert Sample Courts
INSERT INTO courts (id, name, address, thumbnail_url, distance_km, rating, status) VALUES
('court-1', 'CLB Pickleball Cầu Giấy', '123 Đường Cầu Giấy, Hà Nội', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400', 2.5, 4.8, 'available'),
('court-2', 'Sân Pickleball Thủ Đức', '456 Đường Võ Văn Ngân, TP.HCM', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400', 5.2, 4.5, 'live'),
('court-3', 'Arena Pickleball Đống Đa', '789 Láng Hạ, Hà Nội', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400', 1.8, 4.9, 'available')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Packages
INSERT INTO packages (id, name, description, price, duration_minutes, is_best_value) VALUES
('pkg-1', 'Gói Thử Nghiệm', 'Trải nghiệm 30 phút chơi pickleball', 50000, 30, false),
('pkg-2', 'Gói Tiêu Chuẩn', '1 giờ chơi + ghi hình AI', 80000, 60, true),
('pkg-3', 'Gói Premium', '2 giờ chơi + highlight tự động', 150000, 120, false)
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Highlights (for demo)
-- Note: You'll need to replace user_id with actual user IDs after users sign up
-- For now, we'll use a placeholder that you can update later
INSERT INTO highlights (user_id, court_id, thumbnail_url, video_url, duration_sec, likes, views) VALUES
('00000000-0000-0000-0000-000000000000', 'court-1', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=800&fit=crop', 'https://customer-w42898.cloudflarestream.com/sample/manifest/video.m3u8', 25, 12, 150),
('00000000-0000-0000-0000-000000000000', 'court-2', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=800&fit=crop', 'https://customer-w42898.cloudflarestream.com/sample/manifest/video.m3u8', 30, 8, 95),
('00000000-0000-0000-0000-000000000000', 'court-3', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=800&fit=crop', 'https://customer-w42898.cloudflarestream.com/sample/manifest/video.m3u8', 18, 20, 200)
ON CONFLICT DO NOTHING;

-- Verify data
SELECT 'Courts:' as table_name, COUNT(*) as count FROM courts
UNION ALL
SELECT 'Packages:', COUNT(*) FROM packages
UNION ALL
SELECT 'Highlights:', COUNT(*) FROM highlights;
