# 📸 Avatar Upload Setup Guide

## Step 1: Create Storage Buckets on Supabase

1. Go to: https://supabase.com/dashboard/project/uthuigqlvjiscmdqvhxz/storage/buckets

2. Create `avatars` bucket:
   - Click "New bucket"
   - Name: `avatars`
   - Public bucket: ✅ YES (check this!)
   - Click "Create bucket"

3. Create `highlights` bucket:
   - Click "New bucket"  
   - Name: `highlights`
   - Public bucket: ✅ YES
   - Click "Create bucket"

## Step 2: Apply Storage Policies

Run the SQL in `storage_policies.sql` on Supabase SQL Editor.

**IMPORTANT:** If you get errors about policies already existing, run this first:
```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Highlight videos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload highlights" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own highlights" ON storage.objects;
```

Then run `storage_policies.sql`.

## Step 3: Test Avatar Upload on Localhost

1. Open http://localhost:5173/
2. Login
3. Go to Profile page
4. Click on avatar (camera icon)
5. Select an image
6. Upload should work!

## Step 4: Verify Upload

After uploading, check:
1. Supabase Storage: https://supabase.com/dashboard/project/uthuigqlvjiscmdqvhxz/storage/buckets/avatars
2. Should see your uploaded image
3. Profile page should show new avatar

## Troubleshooting

**If upload fails:**
1. Check Console for errors
2. Verify buckets are PUBLIC
3. Verify storage policies are applied
4. Check RLS is disabled on profiles table
