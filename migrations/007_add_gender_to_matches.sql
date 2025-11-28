-- Add gender column to match_requests
ALTER TABLE match_requests 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'mixed', 'any')) DEFAULT 'any';
