-- Migration 015: Fix highlights table thumbnail_url constraint
-- Issue: thumbnail_url is NOT NULL but upload service allows null when thumbnail generation fails on mobile
-- Solution: Make thumbnail_url nullable and use placeholder if needed

-- Make thumbnail_url nullable
ALTER TABLE highlights 
ALTER COLUMN thumbnail_url DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN highlights.thumbnail_url IS 'URL to video thumbnail image. Can be null if thumbnail generation fails, app will use placeholder.';

-- Verification query
-- Run this after migration to confirm the change
SELECT 
    column_name, 
    is_nullable, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'highlights' 
  AND column_name = 'thumbnail_url';

-- Expected result: is_nullable = 'YES'
