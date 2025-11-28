-- Fix highlights table: add missing duration column
-- This fixes the error: "record has no field duration"

ALTER TABLE highlights 
ADD COLUMN IF NOT EXISTS duration_sec INTEGER DEFAULT 15;

-- Update existing records with default duration if they have null
UPDATE highlights 
SET duration_sec = 15 
WHERE duration_sec IS NULL;
