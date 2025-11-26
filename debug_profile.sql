-- DEBUG: Check if profile was created after signup
-- Run this after you sign up with a new account

-- 1. Get the user ID from auth.users
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check if profile exists for that user
-- Replace 'USER_ID_HERE' with the actual user ID from step 1
SELECT * 
FROM profiles 
WHERE id = 'USER_ID_HERE';

-- 3. If no profile, manually create one for testing
-- Replace 'USER_ID_HERE' with actual user ID
INSERT INTO profiles (id, name, phone, credits, membership_tier, has_onboarded)
VALUES (
  'USER_ID_HERE',
  'Test User',
  '0912345678',
  200000,
  'free',
  true
)
ON CONFLICT (id) DO UPDATE
SET name = 'Test User',
    phone = '0912345678',
    has_onboarded = true;

-- 4. Verify
SELECT * FROM profiles WHERE id = 'USER_ID_HERE';
