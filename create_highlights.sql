-- Create sample highlights for your user
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users table
-- To get your user ID: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Step 1: Find your user ID (run this first)
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Step 2: Copy your user ID and replace below, then run
INSERT INTO highlights (user_id, court_id, thumbnail_url, video_url, duration_sec, likes, views) VALUES
('YOUR_USER_ID_HERE', 'court-1', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=800&fit=crop', 'https://customer-w42898.cloudflarestream.com/sample/manifest/video.m3u8', 25, 12, 150),
('YOUR_USER_ID_HERE', 'court-2', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=800&fit=crop', 'https://customer-w42898.cloudflarestream.com/sample/manifest/video.m3u8', 30, 8, 95),
('YOUR_USER_ID_HERE', 'court-3', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=800&fit=crop', 'https://customer-w42898.cloudflarestream.com/sample/manifest/video.m3u8', 18, 20, 200)
ON CONFLICT DO NOTHING;
