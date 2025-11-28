-- Phase 2: Courts Extended Schema
-- Add missing columns to courts table for full court management
-- Run this in Supabase SQL Editor AFTER 001_court_management.sql

-- Add missing columns to courts table
ALTER TABLE courts
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS open_time TEXT DEFAULT '06:00',
ADD COLUMN IF NOT EXISTS close_time TEXT DEFAULT '22:00',
ADD COLUMN IF NOT EXISTS facilities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS distance_km DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger for courts updated_at
DROP TRIGGER IF EXISTS update_courts_updated_at ON courts;
CREATE TRIGGER update_courts_updated_at
    BEFORE UPDATE ON courts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_courts_is_active ON courts(is_active);
CREATE INDEX IF NOT EXISTS idx_courts_created_at ON courts(created_at DESC);

-- Verification query
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'courts' 
AND column_name IN ('description', 'open_time', 'close_time', 'facilities', 'images', 'created_at', 'updated_at', 'thumbnail_url')
ORDER BY column_name;
