-- =====================================================
-- SEED REALISTIC DATA
-- Creates realistic sample data for production demo
-- =====================================================

-- =====================================================
-- 1. CREATE SAMPLE USERS (Profiles)
-- =====================================================
-- Note: You need to create these users in Supabase Auth first
-- Then update their profiles here

-- Sample Vietnamese badminton player names and data
INSERT INTO profiles (id, name, avatar, phone, credits, membership_tier, total_highlights, role, bio, skill_level, followers_count, following_count)
VALUES 
    -- You'll need to replace these UUIDs with actual auth.users IDs
    -- For now, using placeholder format
    (gen_random_uuid(), 'Nguyễn Văn An', 'https://i.pravatar.cc/150?img=1', '0901234567', 500000, 'pro', 15, 'player', 'Yêu cầu lông 5 năm, chuyên đánh đôi nam', 'advanced', 45, 32),
    (gen_random_uuid(), 'Trần Thị Bình', 'https://i.pravatar.cc/150?img=5', '0902345678', 350000, 'elite', 28, 'player', 'Vận động viên cầu lông chuyên nghiệp', 'pro', 128, 67),
    (gen_random_uuid(), 'Lê Minh Cường', 'https://i.pravatar.cc/150?img=12', '0903456789', 200000, 'free', 8, 'player', 'Mới chơi được 2 năm, đang học hỏi', 'intermediate', 12, 18),
    (gen_random_uuid(), 'Phạm Thu Dung', 'https://i.pravatar.cc/150?img=9', '0904567890', 450000, 'pro', 22, 'player', 'Chuyên đánh đơn nữ, top 10 Hà Nội', 'advanced', 89, 45),
    (gen_random_uuid(), 'Hoàng Quốc Huy', 'https://i.pravatar.cc/150?img=15', '0905678901', 150000, 'free', 5, 'player', 'Chơi giải trí cuối tuần', 'beginner', 8, 15),
    (gen_random_uuid(), 'Võ Thị Kim', 'https://i.pravatar.cc/150?img=20', '0906789012', 600000, 'elite', 35, 'both', 'Chủ sân Cầu Lông Vàng, HLV 10 năm kinh nghiệm', 'pro', 234, 89),
    (gen_random_uuid(), 'Đặng Văn Long', 'https://i.pravatar.cc/150?img=33', '0907890123', 280000, 'pro', 12, 'player', 'Đánh cầu lông để giữ sức khỏe', 'intermediate', 23, 28),
    (gen_random_uuid(), 'Bùi Thị Mai', 'https://i.pravatar.cc/150?img=25', '0908901234', 320000, 'pro', 18, 'player', 'Chuyên đánh đôi nữ, tìm bạn đánh cùng', 'advanced', 56, 41),
    (gen_random_uuid(), 'Ngô Đức Nam', 'https://i.pravatar.cc/150?img=51', '0909012345', 180000, 'free', 6, 'player', 'Học sinh THPT, đam mê cầu lông', 'intermediate', 15, 22),
    (gen_random_uuid(), 'Trương Thị Oanh', 'https://i.pravatar.cc/150?img=47', '0900123456', 420000, 'pro', 25, 'player', 'Cựu VĐV quốc gia, giờ chơi phong trào', 'pro', 156, 78)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. CREATE COURT OWNERS
-- =====================================================
INSERT INTO court_owners (profile_id, business_name, tax_id, phone, email, address, bank_account)
SELECT 
    id,
    'Sân Cầu Lông ' || name,
    '010' || LPAD(FLOOR(RANDOM() * 9999999)::TEXT, 7, '0'),
    phone,
    LOWER(REPLACE(name, ' ', '')) || '@gmail.com',
    'Quận ' || (FLOOR(RANDOM() * 12) + 1)::TEXT || ', Hà Nội',
    '1234567890' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0')
FROM profiles
WHERE role IN ('court_owner', 'both')
ON CONFLICT (profile_id) DO NOTHING;

-- =====================================================
-- 3. CREATE COURTS
-- =====================================================
INSERT INTO courts (owner_id, name, address, description, price_per_hour, open_time, close_time, facilities, images, thumbnail_url, status, rating, total_reviews, distance_km, is_active)
SELECT 
    co.id,
    'Sân ' || (ROW_NUMBER() OVER ()) || ' - ' || CASE 
        WHEN RANDOM() < 0.3 THEN 'Cầu Lông Vàng'
        WHEN RANDOM() < 0.6 THEN 'Badminton Pro'
        ELSE 'CLB Cầu Lông'
    END,
    'Số ' || (FLOOR(RANDOM() * 200) + 1)::TEXT || ', ' || 
    CASE 
        WHEN RANDOM() < 0.25 THEN 'Đống Đa'
        WHEN RANDOM() < 0.5 THEN 'Cầu Giấy'
        WHEN RANDOM() < 0.75 THEN 'Hai Bà Trưng'
        ELSE 'Hoàn Kiếm'
    END || ', Hà Nội',
    'Sân cầu lông chuyên nghiệp với ' || (FLOOR(RANDOM() * 6) + 4)::TEXT || ' sân thi đấu. Ánh sáng tốt, mặt sân chuẩn quốc tế.',
    (FLOOR(RANDOM() * 100) + 80) * 1000, -- 80k-180k/hour
    '06:00',
    '22:00',
    ARRAY['Wifi', 'Parking', 'Shower', 'Locker', 'Shop', 'Cafe']::TEXT[],
    ARRAY[
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
        'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800',
        'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800'
    ]::TEXT[],
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400',
    CASE 
        WHEN RANDOM() < 0.2 THEN 'live'
        WHEN RANDOM() < 0.5 THEN 'available'
        WHEN RANDOM() < 0.8 THEN 'busy'
        ELSE 'maintenance'
    END,
    4.0 + RANDOM() * 1.0, -- 4.0-5.0 rating
    FLOOR(RANDOM() * 200) + 20, -- 20-220 reviews
    RANDOM() * 15, -- 0-15km distance
    true
FROM court_owners co
CROSS JOIN generate_series(1, 3) -- 3 courts per owner
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. CREATE HIGHLIGHTS (Videos)
-- =====================================================
INSERT INTO highlights (user_id, court_id, title, description, thumbnail_url, video_url, duration_sec, likes, views, is_public)
SELECT 
    p.id,
    (SELECT id FROM courts ORDER BY RANDOM() LIMIT 1),
    CASE 
        WHEN RANDOM() < 0.25 THEN 'Pha cứu bóng thần thánh'
        WHEN RANDOM() < 0.5 THEN 'Smash cực mạnh'
        WHEN RANDOM() < 0.75 THEN 'Rally 50 nhịp'
        ELSE 'Trận đấu căng thẳng'
    END || ' - ' || TO_CHAR(NOW() - (RANDOM() * INTERVAL '30 days'), 'DD/MM'),
    'Highlight từ trận đấu hôm ' || TO_CHAR(NOW() - (RANDOM() * INTERVAL '30 days'), 'DD/MM/YYYY'),
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=600&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    FLOOR(RANDOM() * 50) + 15, -- 15-65 seconds
    FLOOR(RANDOM() * 200), -- 0-200 likes
    FLOOR(RANDOM() * 1000) + 50, -- 50-1050 views
    RANDOM() < 0.8 -- 80% public
FROM profiles p
CROSS JOIN generate_series(1, FLOOR(RANDOM() * 5) + 1) -- 1-5 highlights per user
WHERE p.role = 'player'
LIMIT 100 -- Limit total highlights
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. CREATE PLAYER CONNECTIONS
-- =====================================================
INSERT INTO player_connections (requester_id, receiver_id, status, created_at)
SELECT DISTINCT
    p1.id,
    p2.id,
    CASE 
        WHEN RANDOM() < 0.7 THEN 'accepted'
        WHEN RANDOM() < 0.9 THEN 'pending'
        ELSE 'declined'
    END,
    NOW() - (RANDOM() * INTERVAL '60 days')
FROM profiles p1
CROSS JOIN profiles p2
WHERE p1.id != p2.id
  AND p1.role = 'player'
  AND p2.role = 'player'
  AND RANDOM() < 0.3 -- 30% chance of connection
LIMIT 50
ON CONFLICT (requester_id, receiver_id) DO NOTHING;

-- =====================================================
-- 6. CREATE PLAYER ACTIVITIES
-- =====================================================
INSERT INTO player_activities (user_id, activity_type, metadata, created_at)
SELECT 
    h.user_id,
    'highlight_posted',
    jsonb_build_object(
        'highlight_id', h.id,
        'thumbnail_url', h.thumbnail_url,
        'duration', h.duration_sec,
        'title', h.title
    ),
    h.created_at
FROM highlights h
WHERE h.is_public = true
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. CREATE BOOKINGS
-- =====================================================
INSERT INTO bookings (user_id, court_id, package_id, start_time, end_time, status, total_amount, created_at)
SELECT 
    p.id,
    (SELECT id FROM courts ORDER BY RANDOM() LIMIT 1),
    CASE WHEN RANDOM() < 0.5 THEN 'pkg_basic' ELSE 'pkg_premium' END,
    NOW() + (RANDOM() * INTERVAL '30 days'),
    NOW() + (RANDOM() * INTERVAL '30 days') + INTERVAL '2 hours',
    CASE 
        WHEN RANDOM() < 0.6 THEN 'confirmed'
        WHEN RANDOM() < 0.8 THEN 'pending'
        WHEN RANDOM() < 0.9 THEN 'completed'
        ELSE 'cancelled'
    END,
    CASE WHEN RANDOM() < 0.5 THEN 150000 ELSE 300000 END,
    NOW() - (RANDOM() * INTERVAL '10 days')
FROM profiles p
CROSS JOIN generate_series(1, FLOOR(RANDOM() * 3) + 1)
WHERE p.role = 'player'
LIMIT 80
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. CREATE INTERACTIONS (Likes)
-- =====================================================
INSERT INTO highlight_interactions (highlight_id, user_id, interaction_type, created_at)
SELECT DISTINCT
    h.id,
    p.id,
    'like',
    NOW() - (RANDOM() * INTERVAL '30 days')
FROM highlights h
CROSS JOIN profiles p
WHERE h.user_id != p.id
  AND p.role = 'player'
  AND RANDOM() < 0.4 -- 40% chance of liking
LIMIT 200
ON CONFLICT (highlight_id, user_id, interaction_type) DO NOTHING;

-- =====================================================
-- 9. CREATE COMMENTS
-- =====================================================
INSERT INTO highlight_comments (highlight_id, user_id, comment, created_at)
SELECT 
    h.id,
    p.id,
    CASE 
        WHEN RANDOM() < 0.2 THEN 'Đỉnh quá! 🔥'
        WHEN RANDOM() < 0.4 THEN 'Pha này hay lắm bro'
        WHEN RANDOM() < 0.6 THEN 'Smash cực mạnh luôn'
        WHEN RANDOM() < 0.8 THEN 'Kỹ thuật tốt đấy'
        ELSE 'Chơi hay, hẹn gặp lại sân nhé'
    END,
    NOW() - (RANDOM() * INTERVAL '25 days')
FROM highlights h
CROSS JOIN profiles p
WHERE h.user_id != p.id
  AND p.role = 'player'
  AND h.is_public = true
  AND RANDOM() < 0.3
LIMIT 150
ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. UPDATE STATISTICS
-- =====================================================
-- Update follower counts based on actual connections
UPDATE profiles p
SET 
    followers_count = (
        SELECT COUNT(*) FROM player_connections 
        WHERE receiver_id = p.id AND status = 'accepted'
    ),
    following_count = (
        SELECT COUNT(*) FROM player_connections 
        WHERE requester_id = p.id AND status = 'accepted'
    );

-- Update highlight counts
UPDATE profiles p
SET total_highlights = (
    SELECT COUNT(*) FROM highlights WHERE user_id = p.id
);

-- Analyze tables for better query performance
ANALYZE profiles;
ANALYZE courts;
ANALYZE highlights;
ANALYZE player_connections;
ANALYZE player_activities;
ANALYZE bookings;

SELECT 'Realistic data seeded successfully!' as status,
       (SELECT COUNT(*) FROM profiles) as profiles_count,
       (SELECT COUNT(*) FROM courts) as courts_count,
       (SELECT COUNT(*) FROM highlights) as highlights_count,
       (SELECT COUNT(*) FROM player_connections) as connections_count,
       (SELECT COUNT(*) FROM bookings) as bookings_count;
